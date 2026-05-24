<?php

use App\Models\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

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

test('user can update product without replacing existing thumbnail', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $category = Category::create([
        'name' => 'Phones',
        'slug' => 'phones',
        'is_publish' => true,
    ]);

    $brand = Brand::create([
        'name' => 'Apple',
        'slug' => 'apple',
        'is_active' => true,
    ]);

    Storage::disk('public')->put('products/existing.jpg', 'existing image');

    $product = Product::create([
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'thumbnail' => 'products/existing.jpg',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->put(route('products.update', $product->id), [
            'name' => 'iPhone 15 Pro',
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'thumbnail' => null,
            'condition' => 'new',
            'base_price' => 16000000,
            'has_variant' => false,
            'is_publish' => true,
        ]);

    $response->assertRedirect(route('products.index'));

    expect($product->refresh())
        ->name->toBe('iPhone 15 Pro')
        ->thumbnail->toBe('products/existing.jpg');

    Storage::disk('public')->assertExists('products/existing.jpg');
});

test('product slugs stay unique when creating products with the same name', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'name' => 'Phones',
        'slug' => 'phones',
        'is_publish' => true,
    ]);

    $payload = [
        'name' => 'iPhone X',
        'category_id' => $category->id,
        'brand_id' => null,
        'condition' => 'new',
        'base_price' => 8000000,
        'has_variant' => false,
        'is_publish' => true,
    ];

    $this
        ->actingAs($user)
        ->post(route('products.store'), $payload)
        ->assertRedirect(route('products.index'));

    $this
        ->actingAs($user)
        ->post(route('products.store'), $payload)
        ->assertRedirect(route('products.index'));

    expect(Product::query()->where('name', 'iPhone X')->pluck('slug')->all())
        ->toBe(['iphone-x', 'iphone-x-2']);
});

test('product slug stays unique when renaming a product to an existing name', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'name' => 'Phones',
        'slug' => 'phones',
        'is_publish' => true,
    ]);

    Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone X',
        'slug' => 'iphone-x',
        'condition' => 'new',
        'base_price' => 8000000,
        'is_publish' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone XR',
        'slug' => 'iphone-xr',
        'condition' => 'new',
        'base_price' => 9000000,
        'is_publish' => true,
    ]);

    $this
        ->actingAs($user)
        ->put(route('products.update', $product->id), [
            'name' => 'iPhone X',
            'category_id' => $category->id,
            'brand_id' => null,
            'condition' => 'new',
            'base_price' => 9000000,
            'has_variant' => false,
            'is_publish' => true,
        ])
        ->assertRedirect(route('products.index'));

    expect($product->refresh())
        ->name->toBe('iPhone X')
        ->slug->toBe('iphone-x-2');
});

test('user can update brand without replacing existing logo', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    Storage::disk('public')->put('brands/existing.svg', 'existing logo');

    $brand = Brand::create([
        'name' => 'Apple',
        'slug' => 'apple',
        'logo' => 'brands/existing.svg',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->put(route('brands.update', $brand->id), [
            'name' => 'Apple Japan',
            'description' => 'Updated description',
            'logo' => null,
            'is_active' => true,
        ]);

    $response->assertRedirect(route('brands.index'));

    expect($brand->refresh())
        ->name->toBe('Apple Japan')
        ->logo->toBe('brands/existing.svg');

    Storage::disk('public')->assertExists('brands/existing.svg');
});

test('user can update category without replacing existing image', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    Storage::disk('public')->put('categories/existing.jpg', 'existing image');

    $category = Category::create([
        'name' => 'Phones',
        'slug' => 'phones',
        'image' => 'categories/existing.jpg',
        'sort_order' => 1,
        'show_home' => false,
        'is_publish' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->put(route('categories.update', $category->id), [
            'name' => 'Smartphones',
            'parent_id' => null,
            'image' => null,
            'sort_order' => 2,
            'show_home' => true,
            'is_publish' => true,
        ]);

    $response->assertRedirect(route('categories.index'));

    expect($category->refresh())
        ->name->toBe('Smartphones')
        ->image->toBe('categories/existing.jpg');

    Storage::disk('public')->assertExists('categories/existing.jpg');
});
