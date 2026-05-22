<?php

use App\Models\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can view product list with summary metrics', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'name' => 'Phones',
        'slug' => 'phones',
        'is_publish' => true,
    ]);

    Category::create([
        'name' => 'Accessories',
        'slug' => 'accessories',
        'is_publish' => true,
    ]);

    $brand = Brand::create([
        'name' => 'Apple',
        'slug' => 'apple',
        'is_active' => true,
    ]);

    Brand::create([
        'name' => 'Sony',
        'slug' => 'sony',
        'is_active' => false,
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

    Product::create([
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'iPhone 14',
        'slug' => 'iphone-14',
        'condition' => 'used',
        'base_price' => 11000000,
        'is_publish' => true,
    ]);

    ProductVariant::create([
        'product_id' => $product->id,
        'name' => '128GB Black',
        'sku' => 'IP15-128-BLK',
        'price' => 14500000,
        'stock' => 1,
        'track_stock' => true,
        'is_active' => true,
    ]);

    ProductVariant::create([
        'product_id' => $product->id,
        'name' => '256GB Blue',
        'sku' => 'IP15-256-BLU',
        'price' => 16500000,
        'stock' => 1,
        'track_stock' => true,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('products.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Product/Index')
        ->where('summary.products', 2)
        ->where('summary.product_variants', 2)
        ->where('summary.brands', 2)
        ->where('summary.categories', 2)
    );
});
