<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->cashier = User::factory()->create();
    $this->cashier->assignRole('cashier');

    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
});

test('cashier can view daily report index', function () {
    $response = $this->actingAs($this->cashier)
        ->get(route('dashboard.cashier.reports.daily'));

    $response->assertStatus(200)
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Dashboard/Cashier/Reports/Daily')
            ->has('summary')
            ->has('paymentBreakdown')
            ->has('orders')
        );
});

test('admin can view daily report index with all cashiers filter', function () {
    $response = $this->actingAs($this->admin)
        ->get(route('dashboard.cashier.reports.daily'));

    $response->assertStatus(200)
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Dashboard/Cashier/Reports/Daily')
            ->has('cashiers')
            ->has('cashierBreakdown')
        );
});

test('unauthorized user cannot view daily report', function () {
    $user = User::factory()->create();
    // no roles assigned

    $response = $this->actingAs($user)
        ->get(route('dashboard.cashier.reports.daily'));

    $response->assertForbidden();
});

test('can export daily report to csv', function () {
    $response = $this->actingAs($this->admin)
        ->get(route('dashboard.cashier.reports.daily.export'));

    $response->assertStatus(200)
        ->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
});

test('can view print page', function () {
    $response = $this->actingAs($this->admin)
        ->get(route('dashboard.cashier.reports.daily.print'));

    $response->assertStatus(200)
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Dashboard/Cashier/Reports/DailyPrint')
            ->has('summary')
        );
});
