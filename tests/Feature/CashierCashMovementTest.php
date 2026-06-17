<?php

use App\Models\Shop\CashierSession;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    // Create necessary permissions and roles if they don't exist
    $permissions = [
        'dashboard.view',
        'cash-movements.view',
        'cash-movements.create',
        'cash-movements.cash-in',
        'cash-movements.cash-out',
        'cash-movements.approve',
    ];

    foreach ($permissions as $perm) {
        Permission::firstOrCreate(['name' => $perm]);
    }

    $cashierRole = Role::firstOrCreate(['name' => 'cashier']);
    $cashierRole->givePermissionTo($permissions);
    
    $adminRole = Role::firstOrCreate(['name' => 'super-admin']);
    $adminRole->givePermissionTo($permissions);

    $this->cashier = User::factory()->create();
    $this->cashier->assignRole('cashier');

    $this->admin = User::factory()->create();
    $this->admin->assignRole('super-admin');

    $this->session = CashierSession::create([
        'cashier_id' => $this->cashier->id,
        'opened_at' => now(),
        'opening_cash' => 100000,
        'status' => 'open',
    ]);
});

it('can view cash movements index', function () {
    $this->actingAs($this->cashier)
        ->get(route('dashboard.cashier.cash-movements.index'))
        ->assertStatus(200);
});

it('can create a cash in movement without approval', function () {
    $response = $this->actingAs($this->cashier)
        ->post(route('dashboard.cashier.cash-movements.store'), [
            'type' => 'cash_in',
            'amount' => 50000,
            'reason' => 'Tambah modal',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('cashier_cash_movements', [
        'cashier_session_id' => $this->session->id,
        'type' => 'cash_in',
        'amount' => 50000,
        'status' => 'approved',
    ]);
});

it('requires approval for large cash out', function () {
    // Large cash out
    $response = $this->actingAs($this->cashier)
        ->post(route('dashboard.cashier.cash-movements.store'), [
            'type' => 'cash_out',
            'amount' => 500000,
            'reason' => 'Tarik uang',
        ]);

    $response->assertRedirect();
    
    $this->assertDatabaseHas('cashier_cash_movements', [
        'cashier_session_id' => $this->session->id,
        'type' => 'cash_out',
        'amount' => 500000,
        'status' => 'pending',
    ]);
});

it('admin can approve pending movement', function () {
    $movement = \App\Models\Shop\CashierCashMovement::create([
        'cashier_session_id' => $this->session->id,
        'cashier_id' => $this->cashier->id,
        'created_by' => $this->cashier->id,
        'type' => 'cash_out',
        'direction' => 'out',
        'amount' => 500000,
        'reason' => 'Tarik uang',
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->admin)
        ->post(route('dashboard.cashier.cash-movements.approve', $movement), [
            'note' => 'OK',
        ]);

    $response->assertRedirect();
    
    $this->assertDatabaseHas('cashier_cash_movements', [
        'id' => $movement->id,
        'status' => 'approved',
        'approved_by' => $this->admin->id,
    ]);
});
