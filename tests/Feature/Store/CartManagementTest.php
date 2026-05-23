<?php

use App\Models\Brand;
use App\Models\Shop\Cart;
use App\Models\Shop\CartItem;
use App\Models\Shop\Category;
use App\Models\Shop\Customer;
use App\Models\Shop\Product;
use App\Models\Shop\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createCartCustomer(array $attributes = []): Customer
{
    return Customer::create(array_merge([
        'name' => 'John Customer',
        'email' => fake()->unique()->safeEmail(),
        'is_active' => true,
    ], $attributes));
}

test('authenticated user can view cart list with summary metrics and insights', function () {
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

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => '128GB Black',
        'sku' => 'IPH15-128-BLK',
        'price' => 15500000,
        'stock' => 10,
        'is_active' => true,
    ]);

    $customer = createCartCustomer();

    // Create a guest cart (customer_id null)
    $cart1 = Cart::create([
        'customer_id' => null,
    ]);

    CartItem::create([
        'cart_id' => $cart1->id,
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'qty' => 1,
    ]);

    // Create a registered customer cart
    $cart2 = Cart::create([
        'customer_id' => $customer->id,
    ]);

    CartItem::create([
        'cart_id' => $cart2->id,
        'product_id' => $product->id,
        'product_variant_id' => null, // use base price
        'qty' => 2,
    ]);

    $response = $this->actingAs($user)
        ->get('/dashboard/ecommerce/carts');

    $response->assertStatus(200);

    // Verify metrics summary props in Inertia
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Cart/Index')
        ->has('summary')
        ->where('summary.total_carts', 2)
        ->where('summary.total_items', 3)
        // 1*15,500,000 + 2*15,000,000 = 45,500,000
        ->where('summary.total_value', 45500000)
        ->where('summary.avg_cart_value', 22750000)
        ->has('top_products')
    );
});

test('user can filter carts by customer type and search query', function () {
    $loggedInUser = User::factory()->create(['name' => 'LoggedInUser']);
    $customer1 = createCartCustomer(['name' => 'John Doe', 'email' => 'john@example.com']);
    $customer2 = createCartCustomer(['name' => 'Alice Smith', 'email' => 'alice@example.com']);

    $cart1 = Cart::create([
        'customer_id' => null, // Guest
    ]);
    $cart1->timestamps = false;
    $cart1->updated_at = now()->subMinutes(20);
    $cart1->save();

    $cart2 = Cart::create([
        'customer_id' => $customer1->id,
    ]);
    $cart2->timestamps = false;
    $cart2->updated_at = now()->subMinutes(10);
    $cart2->save();

    $cart3 = Cart::create([
        'customer_id' => $customer2->id,
    ]);
    $cart3->timestamps = false;
    $cart3->updated_at = now();
    $cart3->save();

    // Filter guest carts only
    $response = $this->actingAs($loggedInUser)
        ->get('/dashboard/ecommerce/carts?customer_type=guest');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Cart/Index')
        ->has('carts.data', 1)
        ->where('carts.data.0.customer', null)
    );

    // Filter registered customer carts only
    $response = $this->actingAs($loggedInUser)
        ->get('/dashboard/ecommerce/carts?customer_type=registered');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Cart/Index')
        ->has('carts.data', 2)
        ->where('carts.data.0.customer.name', 'Alice Smith') // Latest first
        ->where('carts.data.1.customer.name', 'John Doe')
    );

    // Search by name
    $response = $this->actingAs($loggedInUser)
        ->get('/dashboard/ecommerce/carts?search=Alice');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Cart/Index')
        ->has('carts.data', 1)
        ->where('carts.data.0.customer.name', 'Alice Smith')
    );
});

test('user can view cart details', function () {
    $user = User::factory()->create();
    $customer = createCartCustomer(['name' => 'Detail Customer']);

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

    $cart = Cart::create([
        'customer_id' => $customer->id,
    ]);

    $item = CartItem::create([
        'cart_id' => $cart->id,
        'product_id' => $product->id,
        'product_variant_id' => null,
        'qty' => 3,
    ]);

    $response = $this->actingAs($user)
        ->get("/dashboard/ecommerce/carts/{$cart->id}");

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Cart/Show')
        ->where('cart.id', $cart->id)
        ->where('cart.customer.name', 'Detail Customer')
        ->where('cart.total_price', 45000000)
        ->where('cart.items.0.product.name', 'iPhone 15')
    );
});

test('user can delete a specific cart item', function () {
    $user = User::factory()->create();
    $customer = createCartCustomer();

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

    $cart = Cart::create([
        'customer_id' => $customer->id,
    ]);

    $item1 = CartItem::create([
        'cart_id' => $cart->id,
        'product_id' => $product->id,
        'product_variant_id' => null,
        'qty' => 1,
    ]);

    $item2 = CartItem::create([
        'cart_id' => $cart->id,
        'product_id' => $product->id,
        'product_variant_id' => null,
        'qty' => 2,
    ]);

    // Delete item 1
    $response = $this->actingAs($user)
        ->delete("/dashboard/ecommerce/carts/{$cart->id}/items/{$item1->id}");

    $response->assertRedirect();
    $this->assertDatabaseMissing('cart_items', ['id' => $item1->id]);
    $this->assertDatabaseHas('cart_items', ['id' => $item2->id]);
});

test('deleting the last cart item deletes the entire cart', function () {
    $user = User::factory()->create();
    $customer = createCartCustomer();

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

    $cart = Cart::create([
        'customer_id' => $customer->id,
    ]);

    $item = CartItem::create([
        'cart_id' => $cart->id,
        'product_id' => $product->id,
        'product_variant_id' => null,
        'qty' => 1,
    ]);

    // Delete the only item
    $response = $this->actingAs($user)
        ->delete("/dashboard/ecommerce/carts/{$cart->id}/items/{$item->id}");

    $response->assertRedirect(route('carts.index'));
    $this->assertDatabaseMissing('cart_items', ['id' => $item->id]);
    $this->assertDatabaseMissing('carts', ['id' => $cart->id]);
});

test('user can delete the entire cart', function () {
    $user = User::factory()->create();
    $customer = createCartCustomer();

    $cart = Cart::create([
        'customer_id' => $customer->id,
    ]);

    $response = $this->actingAs($user)
        ->delete("/dashboard/ecommerce/carts/{$cart->id}");

    $response->assertRedirect(route('carts.index'));
    $this->assertDatabaseMissing('carts', ['id' => $cart->id]);
});
