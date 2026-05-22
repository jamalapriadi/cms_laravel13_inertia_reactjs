<?php

use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can view product variants with stock units', function () {
    $user = User::factory()->create();

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

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => '128GB Black',
        'sku' => 'IP15-128-BLK',
        'price' => 14500000,
        'stock' => 1,
        'track_stock' => true,
        'is_active' => true,
    ]);

    ProductStockUnit::create([
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '351234567890123',
        'network_compatibility' => 'docomo',
        'status' => 'available',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('product-variants.index'));

    $response->assertSuccessful();
    $response->assertSee('128GB Black');
    $response->assertSee('IP15-128-BLK');
    $response->assertSee('351234567890123');
    $response->assertSee('docomo');
});

test('user can search product variants by stock unit imei', function () {
    $user = User::factory()->create();

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

    $matchingVariant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => '256GB Blue',
        'sku' => 'IP15-256-BLU',
        'price' => 16500000,
        'stock' => 1,
        'track_stock' => true,
        'is_active' => true,
    ]);

    ProductVariant::create([
        'product_id' => $product->id,
        'name' => '128GB Black',
        'sku' => 'IP15-128-BLK',
        'price' => 14500000,
        'stock' => 0,
        'track_stock' => true,
        'is_active' => true,
    ]);

    ProductStockUnit::create([
        'product_variant_id' => $matchingVariant->id,
        'imei_serial_number' => '990000862471854',
        'network_compatibility' => 'softbank',
        'status' => 'available',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('product-variants.index', ['search' => '990000862471854']));

    $response->assertSuccessful();
    $response->assertSee('256GB Blue');
    $response->assertSee('990000862471854');
    $response->assertDontSee('128GB Black');
});

test('user can create product variant with initial stock units', function () {
    $user = User::factory()->create();

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

    $response = $this
        ->actingAs($user)
        ->post(route('product-variants.store'), [
            'product_id' => $product->id,
            'name' => '512GB Natural Titanium',
            'sku' => 'IP15-512-NT',
            'price' => 18500000,
            'track_stock' => true,
            'is_active' => true,
            'stock_units' => [
                [
                    'imei_serial_number' => '351234567890123',
                    'network_compatibility' => 'sim_free',
                    'status' => 'available',
                    'note' => 'Box set',
                ],
                [
                    'imei_serial_number' => '990000862471854',
                    'network_compatibility' => 'softbank',
                    'status' => 'reserved',
                ],
            ],
        ]);

    $response->assertRedirect(route('product-variants.index'));

    $variant = ProductVariant::where('sku', 'IP15-512-NT')->first();

    expect($variant)->not->toBeNull()
        ->and($variant->stock)->toBe(1);

    $this->assertDatabaseHas('product_stock_units', [
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '351234567890123',
        'network_compatibility' => 'sim_free',
        'status' => 'available',
    ]);

    $this->assertDatabaseHas('product_stock_units', [
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '990000862471854',
        'network_compatibility' => 'softbank',
        'status' => 'reserved',
    ]);
});

test('user can view stock units on product variant edit page', function () {
    $user = User::factory()->create();

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

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => '128GB Black',
        'sku' => 'IP15-128-BLK',
        'price' => 14500000,
        'stock' => 1,
        'track_stock' => true,
        'is_active' => true,
    ]);

    ProductStockUnit::create([
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '351234567890123',
        'network_compatibility' => 'docomo',
        'status' => 'available',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('product-variants.edit', $variant->id));

    $response->assertSuccessful();
    $response->assertSee('351234567890123');
    $response->assertSee('docomo');
});
