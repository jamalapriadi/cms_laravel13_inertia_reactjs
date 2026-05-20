<?php

use App\Models\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductImage;
use App\Models\Shop\ProductSpecification;
use App\Models\Shop\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('authenticated user can view product detail page with specs and images', function () {
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
        'description' => 'Test description',
    ]);

    $image = ProductImage::create([
        'product_id' => $product->id,
        'image' => 'products/iphone-15.jpg',
        'is_primary' => true,
        'sort_order' => 1,
    ]);

    $spec = ProductSpecification::create([
        'product_id' => $product->id,
        'spec_name' => 'RAM',
        'spec_value' => '8GB',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('products.show', $product->id));

    $response->assertSuccessful();
    $response->assertSee('iPhone 15');
    $response->assertSee('electronics');
    $response->assertSee('Apple');
    $response->assertSee('RAM');
    $response->assertSee('8GB');
});

test('user can add a specification to a product and it redirects back', function () {
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
        ->from(route('products.show', $product->id))
        ->post(route('product-specifications.store'), [
            'product_id' => $product->id,
            'spec_name' => 'Storage',
            'spec_value' => '256GB',
        ]);

    $response->assertRedirect(route('products.show', $product->id));

    $this->assertDatabaseHas('product_specifications', [
        'product_id' => $product->id,
        'spec_name' => 'Storage',
        'spec_value' => '256GB',
    ]);
});

test('user can upload a product image and it redirects back', function () {
    Storage::fake('public');

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

    $file = UploadedFile::fake()->image('iphone.jpg');

    $response = $this
        ->actingAs($user)
        ->from(route('products.show', $product->id))
        ->post(route('product-images.store'), [
            'product_id' => $product->id,
            'image' => $file,
            'is_primary' => true,
            'sort_order' => 5,
        ]);

    $response->assertRedirect(route('products.show', $product->id));

    $this->assertDatabaseHas('product_images', [
        'product_id' => $product->id,
        'is_primary' => true,
        'sort_order' => 5,
    ]);

    $image = ProductImage::where('product_id', $product->id)->first();
    Storage::disk('public')->assertExists($image->image);
});

test('user can delete a product specification and it redirects back', function () {
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

    $spec = ProductSpecification::create([
        'product_id' => $product->id,
        'spec_name' => 'RAM',
        'spec_value' => '8GB',
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('products.show', $product->id))
        ->delete(route('product-specifications.destroy', $spec->id));

    $response->assertRedirect(route('products.show', $product->id));

    $this->assertDatabaseMissing('product_specifications', [
        'id' => $spec->id,
    ]);
});

test('user can delete a product image and it redirects back', function () {
    Storage::fake('public');

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

    $file = UploadedFile::fake()->image('iphone.jpg');
    $path = Storage::disk('public')->putFile('product_images', $file);

    $image = ProductImage::create([
        'product_id' => $product->id,
        'image' => $path,
        'is_primary' => true,
        'sort_order' => 1,
    ]);

    Storage::disk('public')->assertExists($path);

    $response = $this
        ->actingAs($user)
        ->from(route('products.show', $product->id))
        ->delete(route('product-images.destroy', $image->id));

    $response->assertRedirect(route('products.show', $product->id));

    $this->assertDatabaseMissing('product_images', [
        'id' => $image->id,
    ]);

    Storage::disk('public')->assertMissing($path);
});

test('authenticated user can view product detail page with variants', function () {
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
        'stock' => 10,
        'track_stock' => true,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('products.show', $product->id));

    $response->assertSuccessful();
    $response->assertSee('128GB Black');
    $response->assertSee('IP15-128-BLK');
});

test('user can create a product variant inline and it redirects back', function () {
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
        ->from(route('products.show', $product->id))
        ->post(route('product-variants.store'), [
            'product_id' => $product->id,
            'name' => '256GB Blue',
            'sku' => 'IP15-256-BLU',
            'price' => 16500000,
            'stock' => 5,
            'track_stock' => true,
            'is_active' => true,
        ]);

    $response->assertRedirect(route('products.show', $product->id));

    $this->assertDatabaseHas('product_variants', [
        'product_id' => $product->id,
        'name' => '256GB Blue',
        'sku' => 'IP15-256-BLU',
        'price' => 16500000,
        'stock' => 5,
    ]);
});

test('user can update a product variant inline and it redirects back', function () {
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
        'stock' => 10,
        'track_stock' => true,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('products.show', $product->id))
        ->put(route('product-variants.update', $variant->id), [
            'product_id' => $product->id,
            'name' => '128GB Jet Black',
            'sku' => 'IP15-128-BLK',
            'price' => 14000000,
            'stock' => 8,
            'track_stock' => true,
            'is_active' => true,
        ]);

    $response->assertRedirect(route('products.show', $product->id));

    $this->assertDatabaseHas('product_variants', [
        'id' => $variant->id,
        'name' => '128GB Jet Black',
        'price' => 14000000,
        'stock' => 8,
    ]);
});

test('user can delete a product variant inline and it redirects back', function () {
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
        'stock' => 10,
        'track_stock' => true,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('products.show', $product->id))
        ->delete(route('product-variants.destroy', $variant->id));

    $response->assertRedirect(route('products.show', $product->id));

    $this->assertSoftDeleted($variant);
});

test('user can create a product with imei and carrier network settings', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('products.store'), [
            'category_id' => $category->id,
            'name' => 'iPhone 15 Pro Max',
            'condition' => 'new',
            'base_price' => 20000000,
            'requires_imei' => true,
            'imei_serial_number' => '351234567890123',
            'network_compatibility' => 'docomo',
            'is_publish' => true,
            'has_variant' => false,
        ]);

    $response->assertRedirect(route('products.index'));

    $this->assertDatabaseHas('products', [
        'name' => 'iPhone 15 Pro Max',
        'requires_imei' => true,
        'imei_serial_number' => '351234567890123',
        'network_compatibility' => 'docomo',
    ]);
});

test('user can update a product imei and network settings', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone 15 Pro Max',
        'slug' => 'iphone-15-pro-max',
        'condition' => 'new',
        'base_price' => 20000000,
        'requires_imei' => false,
        'imei_serial_number' => null,
        'network_compatibility' => 'sim_free',
        'is_publish' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->put(route('products.update', $product->id), [
            'category_id' => $category->id,
            'name' => 'iPhone 15 Pro Max',
            'condition' => 'new',
            'base_price' => 20000000,
            'requires_imei' => true,
            'imei_serial_number' => '990000862471854',
            'network_compatibility' => 'softbank',
            'is_publish' => true,
            'has_variant' => false,
        ]);

    $response->assertRedirect(route('products.index'));

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'requires_imei' => true,
        'imei_serial_number' => '990000862471854',
        'network_compatibility' => 'softbank',
    ]);
});
