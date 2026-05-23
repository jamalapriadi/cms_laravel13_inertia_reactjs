<?php

use App\Models\Shop\Cart;
use App\Models\Shop\CartItem;
use App\Models\Shop\Category;
use App\Models\Shop\Customer;
use App\Models\Shop\Order;
use App\Models\Shop\OrderItem;
use App\Models\Shop\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function createDashboardCustomer(array $attributes = []): Customer
{
    return Customer::create(array_merge([
        'name' => 'John Customer',
        'email' => fake()->unique()->safeEmail(),
        'phone' => '081234567890',
        'password' => 'password',
        'is_active' => true,
    ], $attributes));
}

test('authenticated user can view customer dashboard with summary', function () {
    $admin = User::factory()->create();
    $customer = createDashboardCustomer(['name' => 'Jane Customer', 'email' => 'jane@example.com']);

    Order::create([
        'customer_id' => $customer->id,
        'invoice_number' => 'INV-CUST-001',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'customer_phone' => $customer->phone,
        'grand_total' => 2000000,
        'payment_status' => 'paid',
        'status' => 'completed',
    ]);

    Cart::create(['customer_id' => $customer->id]);

    $response = $this->actingAs($admin)
        ->get(route('customers.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Customer/Index')
        ->where('summary.total_customers', 1)
        ->where('summary.active_customers', 1)
        ->where('summary.customers_with_orders', 1)
        ->where('summary.customers_with_carts', 1)
        ->where('summary.total_revenue', 2000000)
        ->where('customers.data.0.name', 'Jane Customer')
        ->where('customers.data.0.orders_count', 1)
        ->where('customers.data.0.carts_count', 1)
    );
});

test('authenticated user can view customer order and cart activity', function () {
    $admin = User::factory()->create();
    $customer = createDashboardCustomer(['name' => 'Activity Customer']);

    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    $order = Order::create([
        'customer_id' => $customer->id,
        'invoice_number' => 'INV-CUST-002',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'grand_total' => 15000000,
        'payment_status' => 'paid',
        'status' => 'completed',
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'price' => 15000000,
        'qty' => 1,
        'subtotal' => 15000000,
    ]);

    $cart = Cart::create(['customer_id' => $customer->id]);
    CartItem::create([
        'cart_id' => $cart->id,
        'product_id' => $product->id,
        'qty' => 1,
    ]);

    $response = $this->actingAs($admin)
        ->get(route('customers.show', $customer));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Customer/Show')
        ->where('customer.name', 'Activity Customer')
        ->where('activity.paid_orders', 1)
        ->where('activity.completed_orders', 1)
        ->where('recentOrders.0.invoice_number', 'INV-CUST-002')
        ->where('recentCarts.0.id', $cart->id)
    );
});

test('authenticated user can disable customer login and reset password', function () {
    $admin = User::factory()->create();
    $customer = createDashboardCustomer(['password' => 'old-password']);

    $response = $this->actingAs($admin)
        ->patch(route('customers.toggle-login', $customer));

    $response->assertRedirect();
    expect($customer->refresh()->is_active)->toBeFalse();

    $response = $this->actingAs($admin)
        ->post(route('customers.reset-password', $customer));

    $response->assertRedirect();
    expect(Hash::check('old-password', $customer->refresh()->password))->toBeFalse();
});

test('authenticated user can delete customer and detach commerce activity', function () {
    $admin = User::factory()->create();
    $customer = createDashboardCustomer();

    $order = Order::create([
        'customer_id' => $customer->id,
        'invoice_number' => 'INV-CUST-003',
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'grand_total' => 100000,
        'payment_status' => 'pending',
        'status' => 'pending',
    ]);

    $cart = Cart::create(['customer_id' => $customer->id]);

    $response = $this->actingAs($admin)
        ->delete(route('customers.destroy', $customer));

    $response->assertRedirect(route('customers.index'));
    expect(Customer::find($customer->id))->toBeNull()
        ->and($order->refresh()->customer_id)->toBeNull()
        ->and($cart->refresh()->customer_id)->toBeNull();
});
