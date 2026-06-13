<?php

use App\Models\Shop\Customer;
use App\Models\User;
use App\Notifications\CustomerResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

test('customer login screen is rendered from the public auth url', function () {
    $response = $this->get(route('customer.auth.login'));

    $response->assertOk();
    expect(route('customer.auth.login', absolute: false))->toBe('/auth/login');
});

test('legacy onboard login redirects to the public auth login url', function () {
    $this->get('/onboard/login')
        ->assertRedirect('/auth/login');
});

test('guest customer dashboard redirects to customer auth login', function () {
    $this->get(route('customer.dashboard'))
        ->assertRedirect(route('customer.auth.login'));
});

test('authenticated customer is redirected away from customer auth pages', function () {
    $customer = Customer::create([
        'name' => 'Jane Customer',
        'email' => 'jane@example.com',
        'password' => 'password',
        'is_active' => true,
    ]);

    $this->actingAs($customer, 'customer')
        ->get(route('customer.auth.login'))
        ->assertRedirect(route('customer.dashboard'));
});

test('admin session is not treated as an authenticated customer session', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('customer.auth.login'))
        ->assertSuccessful();
});

test('customer can register and view dashboard', function () {
    $response = $this->post(route('customer.auth.register.store'), [
        'name' => 'Jane Customer',
        'email' => 'jane@example.com',
        'phone' => '081234567890',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $customer = Customer::where('email', 'jane@example.com')->first();

    $response->assertRedirect(route('customer.dashboard'));
    expect($customer)->not->toBeNull()
        ->and(Hash::check('password123', $customer->password))->toBeTrue();

    $this->actingAs($customer, 'customer')
        ->get(route('customer.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Customer/Dashboard/Index')
            ->where('customer.email', 'jane@example.com')
            ->where('summary.total_orders', 0)
            ->where('summary.pending_orders', 0)
        );
});

test('customer can login with valid credentials', function () {
    $customer = Customer::create([
        'name' => 'John Customer',
        'email' => 'john@example.com',
        'password' => 'password',
        'is_active' => true,
    ]);

    $response = $this->post(route('customer.auth.login.store'), [
        'email' => 'john@example.com',
        'password' => 'password',
        'remember' => true,
    ]);

    $response->assertRedirect(route('customer.dashboard'));
    $this->assertAuthenticatedAs($customer, 'customer');
    expect($customer->refresh()->last_login_at)->not->toBeNull();
});

test('inactive customer cannot login', function () {
    Customer::create([
        'name' => 'Inactive Customer',
        'email' => 'inactive@example.com',
        'password' => 'password',
        'is_active' => false,
    ]);

    $this->post(route('customer.auth.login.store'), [
        'email' => 'inactive@example.com',
        'password' => 'password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest('customer');
});

test('customer can logout from the public auth logout endpoint', function () {
    $customer = Customer::create([
        'name' => 'Logout Customer',
        'email' => 'logout@example.com',
        'password' => 'password',
        'is_active' => true,
    ]);

    $response = $this->actingAs($customer, 'customer')
        ->post(route('customer.auth.logout'));

    $response->assertRedirect(route('customer.auth.login'));
    $this->assertGuest('customer');
});

test('customer can request password reset link', function () {
    Notification::fake();

    $customer = Customer::create([
        'name' => 'Reset Customer',
        'email' => 'reset@example.com',
        'password' => 'password',
        'is_active' => true,
    ]);

    $this->post(route('customer.auth.password.email'), [
        'email' => 'reset@example.com',
    ])->assertSessionHas('status');

    $this->assertDatabaseHas('customer_password_reset_tokens', [
        'email' => 'reset@example.com',
    ]);
    $this->assertDatabaseMissing('password_reset_tokens', [
        'email' => 'reset@example.com',
    ]);

    Notification::assertSentTo($customer, CustomerResetPasswordNotification::class, function ($notification) use ($customer) {
        $this->get(route('customer.auth.password.reset', [
            'token' => $notification->token,
            'email' => $customer->email,
        ]))->assertSuccessful();

        return true;
    });
});

test('customer can recover password with valid token', function () {
    $customer = Customer::create([
        'name' => 'Recover Customer',
        'email' => 'recover@example.com',
        'password' => 'old-password',
        'is_active' => true,
    ]);

    $token = Password::broker('customers')->createToken($customer);

    $this->post(route('customer.auth.password.store'), [
        'token' => $token,
        'email' => 'recover@example.com',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertRedirect(route('customer.auth.login'));

    expect(Hash::check('new-password', $customer->refresh()->password))->toBeTrue();
});
