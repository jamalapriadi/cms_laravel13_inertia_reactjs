<?php

use App\Models\Shop\Customer;
use App\Notifications\CustomerResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

uses(RefreshDatabase::class);

test('customer can register through api and receive token', function () {
    $response = $this->postJson('/api/v1/customer/register', [
        'name' => 'Jane Customer',
        'email' => 'jane@example.com',
        'phone' => '081234567890',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Register berhasil.')
        ->assertJsonPath('data.customer.email', 'jane@example.com')
        ->assertJsonStructure(['data' => ['customer' => ['id', 'name', 'email', 'phone'], 'token', 'token_type']]);

    $customer = Customer::where('email', 'jane@example.com')->first();

    expect($customer)->not->toBeNull()
        ->and(Hash::check('password123', $customer->password))->toBeTrue()
        ->and($customer->accessTokens)->toHaveCount(1)
        ->and($customer->accessTokens->first()->token)->not->toBe($response->json('data.token'));
});

test('customer can login view profile and logout through api', function () {
    $customer = Customer::create([
        'name' => 'John Customer',
        'email' => 'john@example.com',
        'password' => Hash::make('password123'),
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
        'is_active' => true,
    ]);

    $this->postJson('/api/v1/customer/login', [
        'email' => 'wrong@example.com',
        'password' => 'bad-password',
    ])->assertUnauthorized()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Email atau password salah.');
});

test('customer can request api password reset link', function () {
    Notification::fake();

    $customer = Customer::create([
        'name' => 'Reset Customer',
        'email' => 'reset@example.com',
        'password' => Hash::make('password123'),
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

        return str_contains($mail->actionUrl, config('customer.frontend_url').'/reset-password');
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
