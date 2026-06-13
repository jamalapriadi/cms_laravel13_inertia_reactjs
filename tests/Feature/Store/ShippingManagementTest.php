<?php

use App\Models\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Order;
use App\Models\Shop\OrderItem;
use App\Models\Shop\Product;
use App\Models\Shop\Shipping;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createTestOrder(string $invoice, string $name, float $cost = 50000): Order
{
    $category = Category::firstOrCreate([
        'slug' => 'logistics',
    ], [
        'name' => 'Logistics',
        'is_publish' => true,
    ]);

    $brand = Brand::firstOrCreate([
        'slug' => 'generic',
    ], [
        'name' => 'Generic',
        'is_active' => true,
    ]);

    $product = Product::firstOrCreate([
        'slug' => 'package-box',
    ], [
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'Package Box',
        'condition' => 'new',
        'base_price' => 10000,
        'is_publish' => true,
    ]);

    $order = Order::create([
        'invoice_number' => $invoice,
        'customer_name' => $name,
        'customer_email' => 'customer@example.com',
        'customer_phone' => '08123456789',
        'shipping_address' => '123 Main St, Jakarta',
        'subtotal' => 10000,
        'shipping_cost' => $cost,
        'discount' => 0,
        'grand_total' => 10000 + $cost,
        'status' => 'pending',
        'payment_status' => 'pending',
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'price' => 10000,
        'qty' => 1,
        'subtotal' => 10000,
    ]);

    return $order;
}

test('authenticated user can view shipping list with metrics', function () {
    $user = User::factory()->create();
    $order1 = createTestOrder('INV-SHIP-001', 'Alice', 20000);
    $order2 = createTestOrder('INV-SHIP-002', 'Bob', 35000);

    Shipping::create([
        'order_id' => $order1->id,
        'courier' => 'jne',
        'tracking_number' => 'JNE12345',
        'status' => 'shipped',
        'shipping_cost' => 20000,
        'shipping_address' => '123 Main St, Jakarta',
        'shipped_at' => now(),
    ]);

    Shipping::create([
        'order_id' => $order2->id,
        'courier' => 'jnt',
        'tracking_number' => 'JNT98765',
        'status' => 'delivered',
        'shipping_cost' => 35000,
        'shipping_address' => '456 Oak St, Bandung',
        'shipped_at' => now(),
        'delivered_at' => now(),
    ]);

    $response = $this->actingAs($user)
        ->get('/my-admin/dashboard/ecommerce/shipping');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Shipping/Index')
        ->has('summary')
        ->where('summary.total_shipments', 2)
        ->where('summary.shipped_shipments', 1)
        ->where('summary.delivered_shipments', 1)
        ->where('summary.total_cost', 55000)
    );
});

test('user can filter shipping records', function () {
    $user = User::factory()->create();
    $order1 = createTestOrder('INV-FILTER-001', 'Alice', 20000);
    $order2 = createTestOrder('INV-FILTER-002', 'Bob', 30000);

    Shipping::create([
        'order_id' => $order1->id,
        'courier' => 'jne',
        'tracking_number' => 'JNE100',
        'status' => 'shipped',
        'shipping_cost' => 20000,
        'shipping_address' => 'Jakarta',
    ]);

    Shipping::create([
        'order_id' => $order2->id,
        'courier' => 'jnt',
        'tracking_number' => 'JNT200',
        'status' => 'pending',
        'shipping_cost' => 30000,
        'shipping_address' => 'Bandung',
    ]);

    // Filter by courier = jne
    $response = $this->actingAs($user)
        ->get('/my-admin/dashboard/ecommerce/shipping?courier=jne');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Shipping/Index')
        ->has('shippings.data', 1)
        ->where('shippings.data.0.courier', 'jne')
    );

    // Filter by search = Bob
    $response = $this->actingAs($user)
        ->get('/my-admin/dashboard/ecommerce/shipping?search=Bob');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Shipping/Index')
        ->has('shippings.data', 1)
        ->where('shippings.data.0.courier', 'jnt')
    );
});

test('user can create shipping record and trigger order sync', function () {
    $user = User::factory()->create();
    $order = createTestOrder('INV-NEW-001', 'Charlie', 15000);

    // Verify order is initially pending
    $this->assertEquals('pending', $order->status);

    $response = $this->actingAs($user)
        ->post('/my-admin/dashboard/ecommerce/shipping', [
            'order_id' => $order->id,
            'courier' => 'sicepat',
            'tracking_number' => 'REG999',
            'status' => 'shipped',
            'shipping_cost' => 15000,
            'shipping_address' => 'Surabaya',
        ]);

    $response->assertRedirect('/my-admin/dashboard/ecommerce/shipping');

    $this->assertDatabaseHas('shippings', [
        'order_id' => $order->id,
        'courier' => 'sicepat',
        'tracking_number' => 'REG999',
        'status' => 'shipped',
        'shipping_cost' => 15000,
    ]);

    // Order status should be synced to 'shipped'
    $this->assertEquals('shipped', $order->fresh()->status);
});

test('user can update shipping status to delivered and sync order to completed', function () {
    $user = User::factory()->create();
    $order = createTestOrder('INV-UP-001', 'Dan', 25000);

    $shipping = Shipping::create([
        'order_id' => $order->id,
        'courier' => 'jne',
        'tracking_number' => 'JNE444',
        'status' => 'shipped',
        'shipping_cost' => 25000,
        'shipping_address' => 'Jakarta',
    ]);

    $response = $this->actingAs($user)
        ->put("/my-admin/dashboard/ecommerce/shipping/{$shipping->id}", [
            'order_id' => $order->id,
            'courier' => 'jne',
            'tracking_number' => 'JNE444',
            'status' => 'delivered',
            'shipping_cost' => 25000,
            'shipping_address' => 'Jakarta',
        ]);

    $response->assertRedirect('/my-admin/dashboard/ecommerce/shipping');

    $this->assertDatabaseHas('shippings', [
        'id' => $shipping->id,
        'status' => 'delivered',
    ]);

    // Shipped_at and delivered_at should be auto-set
    $updatedShipping = $shipping->fresh();
    $this->assertNotNull($updatedShipping->shipped_at);
    $this->assertNotNull($updatedShipping->delivered_at);

    // Associated order should be completed
    $this->assertEquals('completed', $order->fresh()->status);
});

test('user can delete a shipping record', function () {
    $user = User::factory()->create();
    $order = createTestOrder('INV-DEL-001', 'Eve', 12000);

    $shipping = Shipping::create([
        'order_id' => $order->id,
        'courier' => 'pos',
        'tracking_number' => 'POS111',
        'status' => 'pending',
        'shipping_cost' => 12000,
        'shipping_address' => 'Jogja',
    ]);

    $response = $this->actingAs($user)
        ->delete("/my-admin/dashboard/ecommerce/shipping/{$shipping->id}");

    $response->assertRedirect('/my-admin/dashboard/ecommerce/shipping');
    $this->assertDatabaseMissing('shippings', ['id' => $shipping->id]);
});
