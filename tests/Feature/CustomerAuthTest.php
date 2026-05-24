<?php

use App\Models\Shop\Customer;
use App\Notifications\CustomerResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

test('customer can register and view dashboard', function () {
    $response = $this->post(route('customer.register.store'), [
        'name' => 'Jane Customer',
        'email' => 'jane@example.com',
        'phone' => '081234567890',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $customer = Customer::where('email', 'jane@example.com')->first();

    $response->assertRedirect(route('customer.dashboard'));
    expect($customer)->not->toBeNull()
        ->and(Hash::check('password', $customer->password))->toBeTrue();

    $this->actingAs($customer, 'customer')
        ->get(route('customer.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Customer/Dashboard')
            ->where('customer.email', 'jane@example.com')
            ->where('summary.orders', 0)
        );
});

test('customer can login with valid credentials', function () {
    $customer = Customer::create([
        'name' => 'John Customer',
        'email' => 'john@example.com',
        'password' => 'password',
        'is_active' => true,
    ]);

    $response = $this->post(route('customer.login.store'), [
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

    $this->post(route('customer.login.store'), [
        'email' => 'inactive@example.com',
        'password' => 'password',
    ])->assertSessionHasErrors('email');

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

    $this->post(route('customer.password.email'), [
        'email' => 'reset@example.com',
    ])->assertSessionHas('status');

    $this->assertDatabaseHas('customer_password_reset_tokens', [
        'email' => 'reset@example.com',
    ]);
    $this->assertDatabaseMissing('password_reset_tokens', [
        'email' => 'reset@example.com',
    ]);

    Notification::assertSentTo($customer, CustomerResetPasswordNotification::class);
});

test('customer can recover password with valid token', function () {
    $customer = Customer::create([
        'name' => 'Recover Customer',
        'email' => 'recover@example.com',
        'password' => 'old-password',
        'is_active' => true,
    ]);

    $token = Password::broker('customers')->createToken($customer);

    $this->post(route('customer.password.update'), [
        'token' => $token,
        'email' => 'recover@example.com',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertRedirect(route('customer.login'));

    expect(Hash::check('new-password', $customer->refresh()->password))->toBeTrue();
});
