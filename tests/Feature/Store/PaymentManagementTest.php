<?php

use App\Models\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Order;
use App\Models\Shop\Payment;
use App\Models\Shop\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can view payment list with summary metrics', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

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

    $order1 = Order::create([
        'invoice_number' => 'INV-2026-0001',
        'customer_name' => 'John Doe',
        'customer_email' => 'john@example.com',
        'customer_phone' => '081234567890',
        'shipping_address' => 'Jakarta',
        'subtotal' => 15000000,
        'shipping_cost' => 50000,
        'discount' => 0,
        'grand_total' => 15050000,
        'status' => 'pending',
        'payment_status' => 'pending',
    ]);

    $payment1 = Payment::create([
        'order_id' => $order1->id,
        'payment_method' => 'bank_transfer',
        'transaction_id' => 'TRX-111111',
        'amount' => 15050000,
        'status' => 'paid',
        'payload' => ['bank' => 'bca', 'va_number' => '12345'],
        'paid_at' => now(),
    ]);

    $order2 = Order::create([
        'invoice_number' => 'INV-2026-0002',
        'customer_name' => 'Jane Smith',
        'customer_email' => 'jane@example.com',
        'customer_phone' => '08987654321',
        'shipping_address' => 'Bandung',
        'subtotal' => 5000000,
        'shipping_cost' => 20000,
        'discount' => 0,
        'grand_total' => 5020000,
        'status' => 'pending',
        'payment_status' => 'pending',
    ]);

    $payment2 = Payment::create([
        'order_id' => $order2->id,
        'payment_method' => 'gopay',
        'transaction_id' => 'TRX-222222',
        'amount' => 5020000,
        'status' => 'pending',
        'payload' => ['qr_url' => 'https://gopay.com/qr/123'],
    ]);

    $response = $this->actingAs($user)
        ->get('/my-admin/dashboard/ecommerce/payments');

    $response->assertSuccessful();
    $response->assertSee('TRX-111111');
    $response->assertSee('TRX-222222');
    $response->assertSee('John Doe');
    $response->assertSee('Jane Smith');

    // Verify metrics in Inertia props
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Payment/Index')
        ->has('summary')
        ->where('summary.total_payments', 2)
        ->where('summary.total_revenue', 15050000)
        ->where('summary.pending_amount', 5020000)
        ->where('summary.success_rate', 50)
        ->has('summary.method_distribution')
        ->has('summary.status_distribution')
    );
});

test('user can filter payments by status, method, and query terms', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

    $order1 = Order::create([
        'invoice_number' => 'INV-2026-0001',
        'customer_name' => 'John Doe',
        'customer_email' => 'john@example.com',
        'grand_total' => 10000,
        'status' => 'pending',
        'payment_status' => 'pending',
    ]);

    $payment1 = Payment::create([
        'order_id' => $order1->id,
        'payment_method' => 'bank_transfer',
        'transaction_id' => 'TRX-BCA-123',
        'amount' => 10000,
        'status' => 'paid',
        'paid_at' => now(),
    ]);

    $order2 = Order::create([
        'invoice_number' => 'INV-2026-0002',
        'customer_name' => 'Jane Smith',
        'customer_email' => 'jane@example.com',
        'grand_total' => 20000,
        'status' => 'pending',
        'payment_status' => 'pending',
    ]);

    $payment2 = Payment::create([
        'order_id' => $order2->id,
        'payment_method' => 'gopay',
        'transaction_id' => 'TRX-GOPAY-456',
        'amount' => 20000,
        'status' => 'pending',
    ]);

    // Filter by status = pending
    $response = $this->actingAs($user)
        ->get('/my-admin/dashboard/ecommerce/payments?status=pending');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Payment/Index')
        ->has('payments.data', 1)
        ->where('payments.data.0.transaction_id', 'TRX-GOPAY-456')
    );

    // Filter by payment_method = bank_transfer
    $response = $this->actingAs($user)
        ->get('/my-admin/dashboard/ecommerce/payments?payment_method=bank_transfer');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Payment/Index')
        ->has('payments.data', 1)
        ->where('payments.data.0.transaction_id', 'TRX-BCA-123')
    );

    // Filter by search = Jane
    $response = $this->actingAs($user)
        ->get('/my-admin/dashboard/ecommerce/payments?search=Jane');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Payment/Index')
        ->has('payments.data', 1)
        ->where('payments.data.0.transaction_id', 'TRX-GOPAY-456')
    );
});

test('user can view payment details', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

    $order = Order::create([
        'invoice_number' => 'INV-2026-0001',
        'customer_name' => 'John Doe',
        'customer_email' => 'john@example.com',
        'customer_phone' => '081234567890',
        'shipping_address' => 'Test address',
        'subtotal' => 15000000,
        'shipping_cost' => 50000,
        'discount' => 0,
        'grand_total' => 15050000,
        'status' => 'pending',
        'payment_status' => 'pending',
    ]);

    $payment = Payment::create([
        'order_id' => $order->id,
        'payment_method' => 'bank_transfer',
        'transaction_id' => 'TRX-BCA-123',
        'amount' => 15050000,
        'status' => 'paid',
        'payload' => ['bank' => 'bca', 'va_number' => '12345'],
        'paid_at' => now(),
    ]);

    $response = $this->actingAs($user)
        ->get("/my-admin/dashboard/ecommerce/payments/{$payment->id}");

    $response->assertSuccessful();
    $response->assertSee('TRX-BCA-123');
    $response->assertSee('John Doe');
    $response->assertSee('Test address');
    $response->assertSee('bca');
});
