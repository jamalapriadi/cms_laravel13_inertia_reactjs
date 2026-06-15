<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
    expect(route('dashboard', absolute: false))->toBe('/my-admin/dashboard');
});

test('authenticated users can visit the dashboard', function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    Permission::findOrCreate('dashboard.view', 'web');

    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('legacy dashboard path redirects to the new admin dashboard path', function () {
    $this->get('/dashboard')
        ->assertRedirect('/my-admin/dashboard');
});
