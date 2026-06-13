<?php

use App\Models\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Order;
use App\Models\Shop\OrderItem;
use App\Models\Shop\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can view order list with summary metrics', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $brand = Brand::create([
        'name' => 'Apple',
        'slug' => 'apple',
        'is_active' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    // Create 3 orders with different statuses and payment statuses
    $order1 = Order::create([
        'invoice_number' => 'INV-2026-0001',
        'customer_name' => 'John Doe',
        'customer_email' => 'john@example.com',
        'customer_phone' => '081234567890',
        'shipping_address' => 'Jakarta',
        'subtotal' => 15000000,
        'shipping_cost' => 50000,
        'discount' => 100000,
        'grand_total' => 14950000,
        'status' => 'pending',
        'payment_status' => 'pending',
    ]);

    OrderItem::create([
        'order_id' => $order1->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'price' => 15000000,
        'qty' => 1,
        'subtotal' => 15000000,
    ]);

    $order2 = Order::create([
        'invoice_number' => 'INV-2026-0002',
        'customer_name' => 'Jane Smith',
        'customer_email' => 'jane@example.com',
        'customer_phone' => '08987654321',
        'shipping_address' => 'Bandung',
        'subtotal' => 30000000,
        'shipping_cost' => 100000,
        'discount' => 0,
        'grand_total' => 30100000,
        'status' => 'processing',
        'payment_status' => 'paid',
        'paid_at' => now(),
    ]);

    OrderItem::create([
        'order_id' => $order2->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'price' => 15000000,
        'qty' => 2,
        'subtotal' => 30000000,
    ]);

    $response = $this->actingAs($user)
        ->get('/my-admin/dashboard/orders');

    $response->assertStatus(200);
    $response->assertSee('INV-2026-0001');
    $response->assertSee('INV-2026-0002');
    $response->assertSee('John Doe');
    $response->assertSee('Jane Smith');

    // Verify summary counts prop passed to Inertia
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Order/Index')
        ->has('summary')
        ->where('summary.total_orders', 2)
        ->where('summary.total_revenue', 30100000)
        ->where('summary.pending_orders', 1)
        ->where('summary.processing_orders', 1)
        ->where('summary.completed_orders', 0)
    );
});

test('user can filter orders by status and payment status', function () {
    $user = User::factory()->create();

    $order1 = Order::create([
        'invoice_number' => 'INV-2026-0001',
        'customer_name' => 'John Doe',
        'customer_email' => 'john@example.com',
        'shipping_address' => 'Jakarta',
        'grand_total' => 10000,
        'status' => 'pending',
        'payment_status' => 'pending',
    ]);

    $order2 = Order::create([
        'invoice_number' => 'INV-2026-0002',
        'customer_name' => 'Jane Smith',
        'customer_email' => 'jane@example.com',
        'shipping_address' => 'Bandung',
        'grand_total' => 20000,
        'status' => 'completed',
        'payment_status' => 'paid',
    ]);

    // Filter by order status = completed
    $response = $this->actingAs($user)
        ->get('/my-admin/dashboard/orders?status=completed');

    $response->assertStatus(200);
    $response->assertSee('INV-2026-0002');
    $response->assertDontSee('INV-2026-0001');

    // Filter by payment status = paid
    $response = $this->actingAs($user)
        ->get('/my-admin/dashboard/orders?payment_status=paid');

    $response->assertStatus(200);
    $response->assertSee('INV-2026-0002');
    $response->assertDontSee('INV-2026-0001');

    // Filter by search query
    $response = $this->actingAs($user)
        ->get('/my-admin/dashboard/orders?search=Jane');

    $response->assertStatus(200);
    $response->assertSee('INV-2026-0002');
    $response->assertDontSee('INV-2026-0001');
});

test('user can view order details', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $brand = Brand::create([
        'name' => 'Apple',
        'slug' => 'apple',
        'is_active' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    $order = Order::create([
        'invoice_number' => 'INV-2026-0001',
        'customer_name' => 'John Doe',
        'customer_email' => 'john@example.com',
        'customer_phone' => '081234567890',
        'shipping_address' => 'Test shipping address',
        'subtotal' => 15000000,
        'shipping_cost' => 50000,
        'discount' => 0,
        'grand_total' => 15050000,
        'status' => 'pending',
        'payment_status' => 'pending',
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'price' => 15000000,
        'qty' => 1,
        'subtotal' => 15000000,
    ]);

    $response = $this->actingAs($user)
        ->get("/my-admin/dashboard/orders/{$order->id}");

    $response->assertStatus(200);
    $response->assertSee('INV-2026-0001');
    $response->assertSee('John Doe');
    $response->assertSee('Test shipping address');
    $response->assertSee('iPhone 15');
});

test('user can update order and payment status', function () {
    $user = User::factory()->create();

    $order = Order::create([
        'invoice_number' => 'INV-2026-0001',
        'customer_name' => 'John Doe',
        'customer_email' => 'john@example.com',
        'customer_phone' => '081234567890',
        'shipping_address' => 'Test shipping address',
        'subtotal' => 15000000,
        'shipping_cost' => 50000,
        'discount' => 0,
        'grand_total' => 15050000,
        'status' => 'pending',
        'payment_status' => 'pending',
    ]);

    $response = $this->actingAs($user)
        ->put("/my-admin/dashboard/orders/{$order->id}", [
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

    $response->assertRedirect();

    $order->refresh();
    expect($order->status)->toBe('processing');
    expect($order->payment_status)->toBe('paid');
    expect($order->paid_at)->not->toBeNull();
});

test('user can view order receipt print page', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $brand = Brand::create([
        'name' => 'Apple',
        'slug' => 'apple',
        'is_active' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    $order = Order::create([
        'invoice_number' => 'INV-2026-0001',
        'customer_name' => 'John Doe',
        'customer_email' => 'john@example.com',
        'customer_phone' => '081234567890',
        'shipping_address' => 'Test shipping address',
        'subtotal' => 15000000,
        'shipping_cost' => 50000,
        'discount' => 0,
        'grand_total' => 15050000,
        'status' => 'pending',
        'payment_status' => 'pending',
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'price' => 15000000,
        'qty' => 1,
        'subtotal' => 15000000,
    ]);

    $response = $this->actingAs($user)
        ->get("/my-admin/dashboard/orders/{$order->id}/receipt");

    $response->assertStatus(200);
    $response->assertSee('INV-2026-0001');
    $response->assertSee('John Doe');
    $response->assertSee('Gita Trading');
});
