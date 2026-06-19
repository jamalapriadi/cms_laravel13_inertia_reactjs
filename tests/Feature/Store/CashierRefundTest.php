<?php

use App\Http\Middleware\EnsureDashboardPermission;
use App\Models\Shop\Order;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;

beforeEach(function () {
    $this->user = User::factory()->create();

    // Create permissions
    Permission::firstOrCreate(['name' => 'orders.delete']);
    Permission::firstOrCreate(['name' => 'orders.refund']);

    // Create super-admin role
    $role = Role::firstOrCreate(['name' => 'super-admin']);
    $role->givePermissionTo(['orders.delete', 'orders.refund']);
    $this->user->assignRole($role);
});

it('can cancel an order', function () {
    $order = Order::create([
        'invoice_number' => 'INV-'.time(),
        'customer_name' => 'Test User',
        'status' => 'completed',
        'payment_status' => 'paid',
        'grand_total' => 100000,
    ]);

    $this->withoutExceptionHandling();
    $this->withoutMiddleware(EnsureDashboardPermission::class);

    $response = actingAs($this->user)->post(route('dashboard.cashier.orders.cancel.store', $order), [
        'reason' => 'test cancel',
    ]);

    $response->assertSessionHas('success');

    $order->refresh();
    expect($order->status)->toBe('cancelled')
        ->and($order->payment_status)->toBe('cancelled');
});

it('can fully refund an order', function () {
    $order = Order::create([
        'invoice_number' => 'INV-2-'.time(),
        'customer_name' => 'Test User 2',
        'status' => 'completed',
        'payment_status' => 'paid',
        'grand_total' => 100000,
    ]);

    $this->withoutExceptionHandling();
    $this->withoutMiddleware(EnsureDashboardPermission::class);

    actingAs($this->user)->post(route('dashboard.cashier.orders.refund.full', $order), [
        'reason' => 'test refund',
    ])->assertSessionHas('success');

    $order->refresh();
    expect($order->status)->toBe('refunded')
        ->and($order->payment_status)->toBe('refunded');
});
