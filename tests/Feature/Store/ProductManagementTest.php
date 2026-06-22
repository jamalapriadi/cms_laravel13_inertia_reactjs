<?php

use App\Models\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductVariant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('authenticated user can view product list with summary metrics', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

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
        'sku' => 'IPHONE-15',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    Product::create([
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'iPhone 14',
        'slug' => 'iphone-14',
        'sku' => 'IPHONE-14',
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
    $user->is_super_admin = true;

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
        'sku' => 'IPHONE-15',
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
            'sku' => 'IPHONE-15-PRO',
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
    $user->is_super_admin = true;

    $category = Category::create([
        'name' => 'Phones',
        'slug' => 'phones',
        'is_publish' => true,
    ]);

    $payload1 = [
        'name' => 'iPhone X',
        'category_id' => $category->id,
        'brand_id' => null,
        'sku' => 'IPHONE-X-1',
        'condition' => 'new',
        'base_price' => 8000000,
        'has_variant' => false,
        'is_publish' => true,
    ];

    $payload2 = [
        'name' => 'iPhone X',
        'category_id' => $category->id,
        'brand_id' => null,
        'sku' => 'IPHONE-X-2',
        'condition' => 'new',
        'base_price' => 8000000,
        'has_variant' => false,
        'is_publish' => true,
    ];

    $response1 = $this
        ->actingAs($user)
        ->post(route('products.store'), $payload1);

    $product1 = Product::query()->where('sku', 'IPHONE-X-1')->firstOrFail();
    $response1->assertRedirect(route('products.show', $product1));

    $response2 = $this
        ->actingAs($user)
        ->post(route('products.store'), $payload2);

    $product2 = Product::query()->where('sku', 'IPHONE-X-2')->firstOrFail();
    $response2->assertRedirect(route('products.show', $product2));

    expect(Product::query()->where('name', 'iPhone X')->pluck('slug')->all())
        ->toBe(['iphone-x', 'iphone-x-2']);
});

test('authenticated user can export products to excel', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

    Category::create([
        'name' => 'Phones',
        'slug' => 'phones',
        'is_publish' => true,
    ]);

    Brand::create([
        'name' => 'Apple',
        'slug' => 'apple',
        'is_active' => true,
    ]);

    Product::create([
        'category_id' => Category::first()->id,
        'brand_id' => Brand::first()->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'sku' => 'IPHONE-15',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('products.export'));

    $response->assertOk();
    $response->assertHeader('content-disposition');
    expect($response->headers->get('content-disposition'))->toContain('attachment');
});

test('authenticated user can import products from excel', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

    Category::create([
        'name' => 'Phones',
        'slug' => 'phones',
        'is_publish' => true,
    ]);

    Brand::create([
        'name' => 'Apple',
        'slug' => 'apple',
        'is_active' => true,
    ]);

    Unit::create([
        'name' => 'Piece',
        'code' => 'pcs',
        'is_active' => true,
    ]);

    $csv = "name,slug,category_slug,brand_slug,unit_code,condition,base_price,has_variant,is_publish\n";
    $csv .= "Test Product,test-product,phones,apple,pcs,new,1500000,0,1\n";

    $file = UploadedFile::fake()->createWithContent('products.csv', $csv);

    $response = $this
        ->actingAs($user)
        ->post(route('products.import'), [
            'file' => $file,
        ]);

    $response->assertRedirect(route('products.index'));

    $this->assertDatabaseHas('products', [
        'name' => 'Test Product',
        'slug' => 'test-product',
    ]);
});

test('product slug stays unique when renaming a product to an existing name', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

    $category = Category::create([
        'name' => 'Phones',
        'slug' => 'phones',
        'is_publish' => true,
    ]);

    Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone X',
        'slug' => 'iphone-x',
        'sku' => 'IPHONE-X',
        'condition' => 'new',
        'base_price' => 8000000,
        'is_publish' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone XR',
        'slug' => 'iphone-xr',
        'sku' => 'IPHONE-XR',
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
            'sku' => 'IPHONE-XR-UPDATED',
            'condition' => 'new',
            'base_price' => 9000000,
            'has_variant' => false,
            'is_publish' => true,
        ])
        ->assertRedirect(route('products.index'));

    expect($product->refresh())
        ->name->toBe('iPhone X')
        ->slug->toBe('iphone-xr');
});

test('store entities can use existing media library paths for images', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $user->is_super_admin = true;

    Storage::disk('public')->put('media/2026/05/catalog.webp', 'image');
    Storage::disk('public')->put('media/2026/05/logo.webp', 'image');
    Storage::disk('public')->put('media/2026/05/category.webp', 'image');

    $category = Category::create([
        'name' => 'Phones',
        'slug' => 'phones',
        'is_publish' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('products.store'), [
            'name' => 'iPhone 16',
            'category_id' => $category->id,
            'brand_id' => null,
            'sku' => 'IPHONE-16',
            'thumbnail' => 'media/2026/05/catalog.webp',
            'condition' => 'new',
            'base_price' => 18000000,
            'has_variant' => false,
            'is_publish' => true,
        ]);

    $product = Product::query()->where('name', 'iPhone 16')->firstOrFail();
    $response->assertRedirect(route('products.show', $product));

    $this
        ->actingAs($user)
        ->post(route('brands.store'), [
            'name' => 'Apple Media',
            'description' => 'Uses media library',
            'logo' => 'media/2026/05/logo.webp',
            'is_active' => true,
        ])
        ->assertRedirect(route('brands.index'));

    $this
        ->actingAs($user)
        ->post(route('categories.store'), [
            'name' => 'Accessories',
            'parent_id' => null,
            'image' => 'media/2026/05/category.webp',
            'sort_order' => 0,
            'show_home' => true,
            'is_publish' => true,
        ])
        ->assertRedirect(route('categories.index'));

    expect(Product::query()->where('name', 'iPhone 16')->first()->thumbnail)
        ->toBe('media/2026/05/catalog.webp')
        ->and(Brand::query()->where('name', 'Apple Media')->first()->logo)
        ->toBe('media/2026/05/logo.webp')
        ->and(Category::query()->where('name', 'Accessories')->first()->image)
        ->toBe('media/2026/05/category.webp');
});

test('user can update brand without replacing existing logo', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $user->is_super_admin = true;

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
    $user->is_super_admin = true;

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
