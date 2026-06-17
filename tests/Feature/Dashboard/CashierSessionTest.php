<?php

use App\Models\Shop\CashierSession;
use App\Models\Shop\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Ensure roles exist
    $superAdminRole = Role::firstOrCreate(['name' => 'super_admin']);
    $cashierRole = Role::firstOrCreate(['name' => 'cashier']);

    // Grant dashboard.view permission to these roles or users
    $dashboardPermission = Permission::firstOrCreate(['name' => 'dashboard.view']);
    $ordersViewPermission = Permission::firstOrCreate(['name' => 'orders.view']);
    $ordersCreatePermission = Permission::firstOrCreate(['name' => 'orders.create']);

    $superAdminRole->givePermissionTo([$dashboardPermission, $ordersViewPermission, $ordersCreatePermission]);
    $cashierRole->givePermissionTo([$dashboardPermission, $ordersViewPermission, $ordersCreatePermission]);

    $this->cashier = User::factory()->create();
    $this->cashier->assignRole('cashier');

    $this->admin = User::factory()->create();
    $this->admin->assignRole('super_admin');

    $this->withoutVite();
});

it('allows cashier to view their own sessions', function () {
    CashierSession::factory()->count(3)->create([
        'cashier_id' => $this->cashier->id,
    ]);

    // Create session for someone else
    CashierSession::factory()->create();

    $response = $this->actingAs($this->cashier)
        ->get(route('dashboard.cashier.sessions.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Cashier/Sessions/Index')
        ->has('sessions.data', 3)
    );
});

it('allows admin to view all sessions', function () {
    CashierSession::factory()->count(3)->create([
        'cashier_id' => $this->cashier->id,
    ]);
    CashierSession::factory()->count(2)->create();

    $response = $this->actingAs($this->admin)
        ->get(route('dashboard.cashier.sessions.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Cashier/Sessions/Index')
        ->has('sessions.data', 5)
    );
});

it('allows cashier to open a new shift', function () {
    $response = $this->actingAs($this->cashier)
        ->post(route('dashboard.cashier.sessions.store'), [
            'opening_cash' => 500000,
            'note' => 'Pagi hari',
        ]);

    $response->assertRedirect(route('dashboard.cashier.index'));

    $this->assertDatabaseHas('cashier_sessions', [
        'cashier_id' => $this->cashier->id,
        'opening_cash' => 500000,
        'status' => 'open',
    ]);
});

it('prevents cashier from opening a new shift if one is already open', function () {
    CashierSession::factory()->create([
        'cashier_id' => $this->cashier->id,
        'status' => 'open',
    ]);

    $response = $this->actingAs($this->cashier)
        ->post(route('dashboard.cashier.sessions.store'), [
            'opening_cash' => 500000,
        ]);

    $response->assertSessionHasErrors(['error']);
});

it('allows cashier to view their open shift details', function () {
    $session = CashierSession::factory()->create([
        'cashier_id' => $this->cashier->id,
        'status' => 'open',
    ]);

    $response = $this->actingAs($this->cashier)
        ->get(route('dashboard.cashier.sessions.show', $session->id));

    $response->assertStatus(200);
});

it('prevents cashier from viewing another cashiers shift', function () {
    $otherCashier = User::factory()->create();
    $session = CashierSession::factory()->create([
        'cashier_id' => $otherCashier->id,
    ]);

    $response = $this->actingAs($this->cashier)
        ->get(route('dashboard.cashier.sessions.show', $session->id));

    $response->assertStatus(403);
});

it('allows cashier to close shift', function () {
    $session = CashierSession::factory()->create([
        'cashier_id' => $this->cashier->id,
        'opening_cash' => 100000,
        'status' => 'open',
    ]);

    $response = $this->actingAs($this->cashier)
        ->post(route('dashboard.cashier.sessions.close.store', $session->id), [
            'closing_cash' => 150000,
            'closed_note' => 'Selesai',
        ]);

    $response->assertRedirect(route('dashboard.cashier.sessions.show', $session->id));

    $this->assertDatabaseHas('cashier_sessions', [
        'id' => $session->id,
        'status' => 'closed',
        'closing_cash' => 150000,
        'closed_note' => 'Selesai',
    ]);
});

it('enforces open shift to create POS order', function () {
    // Attempt to access Create Order page without shift
    $response = $this->actingAs($this->cashier)
        ->get(route('dashboard.cashier.orders.create'));

    $response->assertStatus(200);
    // Should render without active_session

    // Attempt to store order
    $response = $this->actingAs($this->cashier)
        ->post(route('dashboard.cashier.orders.store'), [
            'items' => [
                ['product_id' => Str::uuid()->toString(), 'variant_item_id' => null, 'qty' => 1, 'price' => 10000, 'name' => 'Test'],
            ],
            'payment_method' => 'cash',
            'amount_paid' => 10000,
            'change_amount' => 0,
        ]);

    $response->assertSessionHasErrors(['error']);
});
