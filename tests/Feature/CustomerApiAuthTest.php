<?php

use App\Models\Shop\Customer;
use App\Models\Shop\CustomerEmailOtp;
use App\Notifications\CustomerEmailVerificationOtpNotification;
use App\Notifications\CustomerResetPasswordNotification;
use Illuminate\Contracts\Notifications\Dispatcher as NotificationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

uses(RefreshDatabase::class);

test('customer can register through api and receive activation otp', function () {
    Notification::fake();

    $response = $this->postJson('/api/v1/customer/register', [
        'name' => 'Jane Customer',
        'email' => 'jane@example.com',
        'phone' => '081234567890',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Registrasi berhasil. Kode OTP telah dikirim ke email untuk aktivasi akun.')
        ->assertJsonPath('data.email', 'jane@example.com')
        ->assertJsonPath('data.requires_otp', true)
        ->assertJsonMissingPath('data.token');

    $customer = Customer::where('email', 'jane@example.com')->first();

    expect($customer)->not->toBeNull()
        ->and(Hash::check('password123', $customer->password))->toBeTrue()
        ->and($customer->is_active)->toBeFalse()
        ->and($customer->email_verified_at)->toBeNull()
        ->and($customer->accessTokens)->toHaveCount(0)
        ->and($customer->emailOtps)->toHaveCount(1);

    Notification::assertSentTo($customer, CustomerEmailVerificationOtpNotification::class, function ($notification) use ($customer) {
        $otp = $customer->emailOtps()->first();

        return strlen($notification->otp) === 6
            && ctype_digit($notification->otp)
            && $otp->otp_hash !== $notification->otp
            && Hash::check($notification->otp, $otp->otp_hash);
    });
});

test('customer register still succeeds when activation otp email fails', function () {
    Log::shouldReceive('error')
        ->once()
        ->with('Failed to send customer email verification OTP.', Mockery::on(function (array $context) {
            return $context['email'] === 'mail-fails@example.com'
                && $context['exception'] instanceof RuntimeException;
        }));

    app()->instance(NotificationDispatcher::class, Mockery::mock(NotificationDispatcher::class, function ($mock) {
        $mock->shouldReceive('send')
            ->once()
            ->andThrow(new RuntimeException('SMTP connection failed'));
    }));

    $response = $this->postJson('/api/v1/customer/register', [
        'name' => 'Mail Fails',
        'email' => 'mail-fails@example.com',
        'phone' => '081234567891',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Registrasi berhasil. Kode OTP telah dibuat, namun email OTP belum berhasil dikirim. Silakan coba kirim ulang OTP.')
        ->assertJsonPath('data.email', 'mail-fails@example.com')
        ->assertJsonPath('data.requires_otp', true);

    $customer = Customer::where('email', 'mail-fails@example.com')->first();

    expect($customer)->not->toBeNull()
        ->and($customer->is_active)->toBeFalse()
        ->and($customer->email_verified_at)->toBeNull()
        ->and($customer->emailOtps)->toHaveCount(1);
});

test('customer can login view profile and logout through api', function () {
    $customer = Customer::create([
        'name' => 'John Customer',
        'email' => 'john@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $loginResponse = $this->postJson('/api/v1/customer/login', [
        'email' => 'john@example.com',
        'password' => 'password123',
    ]);

    $loginResponse->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Login berhasil.')
        ->assertJsonPath('data.customer.id', $customer->id);

    $token = $loginResponse->json('data.token');

    $this->withToken($token)
        ->getJson('/api/v1/customer/me')
        ->assertSuccessful()
        ->assertJsonPath('data.customer.email', 'john@example.com');

    $this->withToken($token)
        ->postJson('/api/v1/customer/logout')
        ->assertSuccessful()
        ->assertJsonPath('message', 'Logout berhasil.');

    $this->withToken($token)
        ->getJson('/api/v1/customer/me')
        ->assertUnauthorized();
});

test('customer api login rejects invalid credentials generically', function () {
    Customer::create([
        'name' => 'Wrong Password',
        'email' => 'wrong@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $this->postJson('/api/v1/customer/login', [
        'email' => 'wrong@example.com',
        'password' => 'bad-password',
    ])->assertUnauthorized()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Email atau password salah.');
});

test('customer api login requires otp for inactive customer', function () {
    Customer::create([
        'name' => 'Inactive Customer',
        'email' => 'inactive@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => null,
        'is_active' => false,
    ]);

    $this->postJson('/api/v1/customer/login', [
        'email' => 'inactive@example.com',
        'password' => 'password123',
    ])->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Akun belum aktif. Silakan verifikasi OTP yang dikirim ke email.')
        ->assertJsonPath('data.email', 'inactive@example.com')
        ->assertJsonPath('data.requires_otp', true)
        ->assertJsonMissingPath('data.token');
});

test('customer can verify valid otp and activate account', function () {
    $customer = Customer::create([
        'name' => 'Verify Customer',
        'email' => 'verify@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => null,
        'is_active' => false,
    ]);

    $otp = $customer->emailOtps()->create([
        'email' => 'verify@example.com',
        'otp_hash' => Hash::make('123456'),
        'type' => CustomerEmailOtp::TYPE_EMAIL_VERIFICATION,
        'expires_at' => now()->addMinutes(10),
    ]);

    $this->postJson('/api/v1/customer/verify-otp', [
        'email' => 'verify@example.com',
        'otp' => '123456',
    ])->assertSuccessful()
        ->assertJsonPath('message', 'Verifikasi OTP berhasil. Akun Anda sudah aktif.')
        ->assertJsonPath('data.email', 'verify@example.com')
        ->assertJsonPath('data.is_active', true);

    expect($customer->refresh()->is_active)->toBeTrue()
        ->and($customer->email_verified_at)->not->toBeNull()
        ->and($otp->refresh()->verified_at)->not->toBeNull();
});

test('customer verify otp rejects invalid otp', function () {
    $customer = Customer::create([
        'name' => 'Invalid Otp',
        'email' => 'invalid-otp@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => null,
        'is_active' => false,
    ]);

    $customer->emailOtps()->create([
        'email' => 'invalid-otp@example.com',
        'otp_hash' => Hash::make('123456'),
        'type' => CustomerEmailOtp::TYPE_EMAIL_VERIFICATION,
        'expires_at' => now()->addMinutes(10),
    ]);

    $this->postJson('/api/v1/customer/verify-otp', [
        'email' => 'invalid-otp@example.com',
        'otp' => '654321',
    ])->assertUnprocessable()
        ->assertJsonPath('message', 'Kode OTP tidak valid.');

    expect($customer->refresh()->is_active)->toBeFalse()
        ->and($customer->email_verified_at)->toBeNull();
});

test('customer verify otp rejects expired otp', function () {
    $customer = Customer::create([
        'name' => 'Expired Otp',
        'email' => 'expired-otp@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => null,
        'is_active' => false,
    ]);

    $otp = $customer->emailOtps()->create([
        'email' => 'expired-otp@example.com',
        'otp_hash' => Hash::make('123456'),
        'type' => CustomerEmailOtp::TYPE_EMAIL_VERIFICATION,
        'expires_at' => now()->subMinute(),
    ]);

    $this->postJson('/api/v1/customer/verify-otp', [
        'email' => 'expired-otp@example.com',
        'otp' => '123456',
    ])->assertUnprocessable()
        ->assertJsonPath('message', 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.');

    expect($customer->refresh()->is_active)->toBeFalse()
        ->and($otp->refresh()->invalidated_at)->not->toBeNull();
});

test('customer can resend otp and invalidate previous otp', function () {
    Notification::fake();

    $customer = Customer::create([
        'name' => 'Resend Customer',
        'email' => 'resend@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => null,
        'is_active' => false,
    ]);

    $oldOtp = $customer->emailOtps()->create([
        'email' => 'resend@example.com',
        'otp_hash' => Hash::make('123456'),
        'type' => CustomerEmailOtp::TYPE_EMAIL_VERIFICATION,
        'expires_at' => now()->addMinutes(10),
    ]);

    $this->postJson('/api/v1/customer/resend-otp', [
        'email' => 'resend@example.com',
    ])->assertSuccessful()
        ->assertJsonPath('message', 'Kode OTP baru telah dikirim ke email Anda.')
        ->assertJsonPath('data.email', 'resend@example.com');

    expect($oldOtp->refresh()->invalidated_at)->not->toBeNull()
        ->and($customer->emailOtps()->whereNull('verified_at')->whereNull('invalidated_at')->count())->toBe(1);

    Notification::assertSentTo($customer, CustomerEmailVerificationOtpNotification::class, function ($notification) use ($customer, $oldOtp) {
        $latestOtp = $customer->emailOtps()
            ->whereNull('verified_at')
            ->whereNull('invalidated_at')
            ->latest()
            ->first();

        return $latestOtp !== null
            && $latestOtp->isNot($oldOtp)
            && $latestOtp->type === CustomerEmailOtp::TYPE_EMAIL_VERIFICATION
            && $latestOtp->email === 'resend@example.com'
            && $latestOtp->otp_hash !== $notification->otp
            && Hash::check($notification->otp, $latestOtp->otp_hash);
    });

    $this->postJson('/api/v1/customer/verify-otp', [
        'email' => 'resend@example.com',
        'otp' => '123456',
    ])->assertUnprocessable()
        ->assertJsonPath('message', 'Kode OTP tidak valid.');
});

test('customer resend otp still creates latest otp when email fails', function () {
    Log::shouldReceive('error')
        ->once()
        ->with('Failed to send customer email verification OTP.', Mockery::on(function (array $context) {
            return $context['email'] === 'resend-mail-fails@example.com'
                && $context['exception'] instanceof RuntimeException;
        }));

    app()->instance(NotificationDispatcher::class, Mockery::mock(NotificationDispatcher::class, function ($mock) {
        $mock->shouldReceive('send')
            ->once()
            ->andThrow(new RuntimeException('SMTP connection failed'));
    }));

    $customer = Customer::create([
        'name' => 'Resend Mail Fails',
        'email' => 'resend-mail-fails@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => null,
        'is_active' => false,
    ]);

    $oldOtp = $customer->emailOtps()->create([
        'email' => 'resend-mail-fails@example.com',
        'otp_hash' => Hash::make('123456'),
        'type' => CustomerEmailOtp::TYPE_EMAIL_VERIFICATION,
        'expires_at' => now()->addMinutes(10),
    ]);

    $this->postJson('/api/v1/customer/resend-otp', [
        'email' => 'resend-mail-fails@example.com',
    ])->assertSuccessful()
        ->assertJsonPath('message', 'Kode OTP baru telah dibuat, namun email OTP belum berhasil dikirim. Silakan coba lagi nanti.')
        ->assertJsonPath('data.email', 'resend-mail-fails@example.com');

    $latestOtp = $customer->emailOtps()
        ->whereNull('verified_at')
        ->whereNull('invalidated_at')
        ->latest()
        ->first();

    expect($oldOtp->refresh()->invalidated_at)->not->toBeNull()
        ->and($latestOtp)->not->toBeNull()
        ->and($latestOtp->isNot($oldOtp))->toBeTrue();
});

test('customer can request api password reset link', function () {
    Notification::fake();

    $customer = Customer::create([
        'name' => 'Reset Customer',
        'email' => 'reset@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $this->postJson('/api/v1/customer/forgot-password', [
        'email' => 'reset@example.com',
    ])->assertSuccessful()
        ->assertJsonPath('message', 'Link reset password telah dikirim ke email Anda.');

    $this->assertDatabaseHas('customer_password_reset_tokens', [
        'email' => 'reset@example.com',
    ]);

    Notification::assertSentTo($customer, CustomerResetPasswordNotification::class, function ($notification) {
        $mail = $notification->toMail(Customer::where('email', 'reset@example.com')->first());

        return $mail->actionUrl === route('customer.auth.password.reset', [
            'token' => $notification->token,
            'email' => 'reset@example.com',
        ]);
    });
});

test('unknown email receives generic forgot password api response', function () {
    Notification::fake();

    $this->postJson('/api/v1/customer/forgot-password', [
        'email' => 'missing@example.com',
    ])->assertSuccessful()
        ->assertJsonPath('message', 'Link reset password telah dikirim ke email Anda.');

    Notification::assertNothingSent();
});

test('customer can reset password through api with valid token', function () {
    $customer = Customer::create([
        'name' => 'Recover Customer',
        'email' => 'recover@example.com',
        'password' => Hash::make('old-password'),
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $token = Password::broker('customers')->createToken($customer);

    $this->postJson('/api/v1/customer/reset-password', [
        'email' => 'recover@example.com',
        'token' => $token,
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertSuccessful()
        ->assertJsonPath('message', 'Password berhasil direset. Silakan login kembali.');

    expect(Hash::check('new-password', $customer->refresh()->password))->toBeTrue();
});
