<?php

use App\Models\Dashboard\Option;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    Permission::findOrCreate('dashboard.view', 'web');
    Permission::findOrCreate('options.create', 'web');
    Permission::findOrCreate('brands.view', 'web');
    Permission::findOrCreate('units.view', 'web');
    Permission::findOrCreate('products.view', 'web');
    Permission::findOrCreate('orders.view', 'web');

    $this->user->givePermissionTo([
        'dashboard.view',
        'options.create',
        'brands.view',
        'units.view',
        'products.view',
        'orders.view',
    ]);
});

test('website mode defaults to commerce and allows all routes', function () {
    $this->actingAs($this->user);

    $this->get('/my-admin/dashboard/brands')->assertStatus(200);
    $this->get('/my-admin/dashboard/units')->assertStatus(200);
    $this->get('/my-admin/dashboard/ecommerce/products')->assertStatus(200);
    $this->get('/my-admin/dashboard/orders')->assertStatus(200);
});

test('website mode blog blocks all e-commerce routes', function () {
    Option::updateOrCreate(['key' => 'website_mode'], ['value' => 'blog']);

    $this->actingAs($this->user);

    $this->get('/my-admin/dashboard/brands')->assertStatus(403);
    $this->get('/my-admin/dashboard/units')->assertStatus(403);
    $this->get('/my-admin/dashboard/ecommerce/products')->assertStatus(403);
    $this->get('/my-admin/dashboard/orders')->assertStatus(403);
});

test('website mode simple_blog_commerce only allows enabled routes', function () {
    Option::updateOrCreate(['key' => 'website_mode'], ['value' => 'simple_blog_commerce']);
    Option::updateOrCreate(['key' => 'enabled_ecommerce_menus'], ['value' => ['products', 'orders']]);

    $this->actingAs($this->user);

    // Allowed
    $this->get('/my-admin/dashboard/ecommerce/products')->assertStatus(200);
    $this->get('/my-admin/dashboard/orders')->assertStatus(200);

    // Blocked
    $this->get('/my-admin/dashboard/brands')->assertStatus(403);
    $this->get('/my-admin/dashboard/units')->assertStatus(403);
});

test('website mode validation fails for invalid modes', function () {
    $this->actingAs($this->user);

    $this->post('/my-admin/dashboard/options', [
        'website_mode' => 'invalid_mode',
    ])->assertSessionHasErrors('website_mode');
});

test('website mode validation fails for invalid enabled ecommerce menus', function () {
    $this->actingAs($this->user);

    $this->post('/my-admin/dashboard/options', [
        'website_mode' => 'simple_blog_commerce',
        'enabled_ecommerce_menus' => ['invalid_menu', 'products'],
    ])->assertSessionHasErrors('enabled_ecommerce_menus.0');
});

test('website mode can be updated successfully via options controller', function () {
    $this->actingAs($this->user);

    $this->post('/my-admin/dashboard/options', [
        'website_mode' => 'simple_blog_commerce',
        'enabled_ecommerce_menus' => ['products', 'orders'],
    ])->assertRedirect();

    expect(get_option('website_mode'))->toBe('simple_blog_commerce');
    expect(get_option('enabled_ecommerce_menus'))->toBe(['products', 'orders']);
});
