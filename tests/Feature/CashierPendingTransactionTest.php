<?php

use App\Models\Shop\CashierPendingTransaction;
use App\Models\Shop\CashierSession;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->session = CashierSession::create([
        'cashier_id' => $this->user->id,
        'status' => 'open',
        'opening_cash' => 100000,
        'opened_at' => now(),
    ]);

    $category = Category::forceCreate([
        'id' => Str::uuid()->toString(),
        'name' => 'Test Category',
        'slug' => 'test-category',
    ]);

    $this->product = Product::forceCreate([
        'id' => Str::uuid()->toString(),
        'category_id' => $category->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'sku' => 'TEST-001',
        'base_price' => 50000,
        'is_publish' => true,
        'has_variant' => false,
    ]);

    Gate::before(fn () => true);

    app()[PermissionRegistrar::class]->forgetCachedPermissions();
    Permission::firstOrCreate(['name' => 'orders.view_all', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'orders.create', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'orders.edit', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'orders.delete', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'dashboard.view', 'guard_name' => 'web']);
});

test('cashier can hold a cart (create pending transaction)', function () {
    $response = $this->actingAs($this->user)
        ->post('/my-admin/dashboard/cashier/pending-transactions', [
            'name' => 'Meja 1',
            'customer_name' => 'Budi',
            'customer_phone' => '081234567890',
            'discount' => 5000,
            'note' => 'Cepat ya',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_item_id' => null,
                    'qty' => 2,
                ],
            ],
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect('/my-admin/dashboard/cashier/pending-transactions');
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('cashier_pending_transactions', [
        'cashier_id' => $this->user->id,
        'name' => 'Meja 1',
        'status' => 'pending',
        'subtotal' => 100000,
        'discount_amount' => 5000,
        'grand_total' => 95000,
    ]);

    $this->assertDatabaseHas('cashier_pending_transaction_items', [
        'product_id' => $this->product->id,
        'quantity' => 2,
        'unit_price' => 50000,
        'subtotal' => 100000,
    ]);
});

test('cashier can view pending transactions list', function () {
    $this->actingAs($this->user)
        ->post('/my-admin/dashboard/cashier/pending-transactions', [
            'name' => 'Meja 1',
            'items' => [['product_id' => $this->product->id, 'qty' => 1]],
        ]);

    $response = $this->actingAs($this->user)
        ->get('/my-admin/dashboard/cashier/pending-transactions');

    $response->assertStatus(200);
});

test('cashier can resume a pending transaction', function () {
    $this->actingAs($this->user)
        ->post('/my-admin/dashboard/cashier/pending-transactions', [
            'name' => 'Meja 1',
            'items' => [['product_id' => $this->product->id, 'qty' => 1]],
        ]);

    $pending = CashierPendingTransaction::latest()->first();

    $response = $this->actingAs($this->user)
        ->post('/my-admin/dashboard/cashier/pending-transactions/'.$pending->id.'/resume');

    $response->assertSessionHasNoErrors();
    if ($response->exception) {
        throw $response->exception;
    }
    $response->assertRedirect('/my-admin/dashboard/cashier/orders/create?pending_transaction_id='.$pending->id);
});

test('cashier can cancel a pending transaction', function () {
    $this->actingAs($this->user)
        ->post('/my-admin/dashboard/cashier/pending-transactions', [
            'name' => 'Meja 1',
            'items' => [['product_id' => $this->product->id, 'qty' => 1]],
        ]);

    $pending = CashierPendingTransaction::latest()->first();

    $response = $this->actingAs($this->user)
        ->post('/my-admin/dashboard/cashier/pending-transactions/'.$pending->id.'/cancel');

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();
    $this->assertDatabaseHas('cashier_pending_transactions', [
        'id' => $pending->id,
        'status' => 'cancelled',
    ]);
});
