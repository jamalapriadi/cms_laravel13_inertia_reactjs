<?php

use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\ProductVariant;
use App\Models\Shop\ProductVariantOption;
use App\Models\Shop\VariantItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

test('authenticated user can view product variant items list', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'sku' => 'IP15-BASE',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Color',
        'sort_order' => 0,
    ]);

    $option = ProductVariantOption::create([
        'product_variant_id' => $variant->id,
        'value' => 'Black',
        'sort_order' => 0,
    ]);

    $variantItem = VariantItem::create([
        'product_id' => $product->id,
        'name' => '128GB Black',
        'sku' => 'IP15-128-BLK',
        'selling_price' => 14500000,
        'stock' => 1,
        'track_stock' => true,
        'is_active' => true,
    ]);

    DB::table('variant_item_options')->insert([
        'id' => (string) Str::uuid(),
        'variant_item_id' => $variantItem->id,
        'product_variant_option_id' => $option->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('variant-items.index'));

    $response->assertSuccessful();
    $response->assertSee('128GB Black');
    $response->assertSee('IP15-128-BLK');
});

test('user can search product variant items by name or sku', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'sku' => 'IP15-BASE',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Color',
        'sort_order' => 0,
    ]);

    $optionBlue = ProductVariantOption::create([
        'product_variant_id' => $variant->id,
        'value' => 'Blue',
        'sort_order' => 0,
    ]);

    $optionBlack = ProductVariantOption::create([
        'product_variant_id' => $variant->id,
        'value' => 'Black',
        'sort_order' => 1,
    ]);

    $matchingVariant = VariantItem::create([
        'product_id' => $product->id,
        'name' => '256GB Blue',
        'sku' => 'IP15-256-BLU',
        'selling_price' => 16500000,
        'stock' => 1,
        'track_stock' => true,
        'is_active' => true,
    ]);

    DB::table('variant_item_options')->insert([
        'id' => (string) Str::uuid(),
        'variant_item_id' => $matchingVariant->id,
        'product_variant_option_id' => $optionBlue->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $otherVariant = VariantItem::create([
        'product_id' => $product->id,
        'name' => '128GB Black',
        'sku' => 'IP15-128-BLK',
        'selling_price' => 14500000,
        'stock' => 0,
        'track_stock' => true,
        'is_active' => true,
    ]);

    DB::table('variant_item_options')->insert([
        'id' => (string) Str::uuid(),
        'variant_item_id' => $otherVariant->id,
        'product_variant_option_id' => $optionBlack->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('variant-items.index', ['search' => 'IP15-256-BLU']));

    $response->assertSuccessful();
    $response->assertSee('256GB Blue');
    $response->assertSee('IP15-256-BLU');
    $response->assertDontSee('128GB Black');
});

test('user can create product variant item', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'sku' => 'IP15-BASE',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Color',
        'sort_order' => 0,
    ]);

    $option = ProductVariantOption::create([
        'product_variant_id' => $variant->id,
        'value' => 'Natural Titanium',
        'sort_order' => 0,
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('variant-items.store'), [
            'product_id' => $product->id,
            'name' => '512GB Natural Titanium',
            'sku' => 'IP15-512-NT',
            'selling_price' => 18500000,
            'track_stock' => true,
            'is_active' => true,
            'option_ids' => [$option->id],
        ]);

    $response->assertRedirect(route('variant-items.index', ['product_id' => $product->id]));

    $variantItem = VariantItem::where('sku', 'IP15-512-NT')->first();

    expect($variantItem)->not->toBeNull()
        ->and($variantItem->selling_price)->toBe('18500000.00');
});

test('user can view product variant item edit page', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'sku' => 'IP15-BASE',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Color',
        'sort_order' => 0,
    ]);

    $option = ProductVariantOption::create([
        'product_variant_id' => $variant->id,
        'value' => 'Black',
        'sort_order' => 0,
    ]);

    $variantItem = VariantItem::create([
        'product_id' => $product->id,
        'name' => '128GB Black',
        'sku' => 'IP15-128-BLK',
        'selling_price' => 14500000,
        'stock' => 1,
        'track_stock' => true,
        'is_active' => true,
    ]);
    DB::table('variant_item_options')->insert([
        'id' => (string) Str::uuid(),
        'variant_item_id' => $variantItem->id,
        'product_variant_option_id' => $option->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    ProductStockUnit::create([
        'product_id' => $product->id,
        'product_variant_id' => $variantItem->id,
        'imei_serial_number' => '351234567890123',
        'status' => 'available',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('variant-items.edit', $variantItem->id));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/VariantItem/Edit')
        ->where('variantItem.sku', 'IP15-128-BLK')
    );
});

test('user can update product variant item without replacing existing image', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $user->is_super_admin = true;

    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'sku' => 'IP15-BASE',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Color',
        'sort_order' => 0,
    ]);

    $option = ProductVariantOption::create([
        'product_variant_id' => $variant->id,
        'value' => 'Black',
        'sort_order' => 0,
    ]);

    Storage::disk('public')->put('variant_items/existing.jpg', 'existing image');

    $variantItem = VariantItem::create([
        'product_id' => $product->id,
        'name' => '128GB Black',
        'sku' => 'IP15-128-BLK',
        'image' => 'variant_items/existing.jpg',
        'selling_price' => 14500000,
        'stock' => 1,
        'track_stock' => true,
        'is_active' => true,
    ]);
    DB::table('variant_item_options')->insert([
        'id' => (string) Str::uuid(),
        'variant_item_id' => $variantItem->id,
        'product_variant_option_id' => $option->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this
        ->actingAs($user)
        ->put(route('variant-items.update', $variantItem->id), [
            'product_id' => $product->id,
            'name' => '128GB Midnight',
            'sku' => 'IP15-128-BLK',
            'image' => null,
            'selling_price' => 14600000,
            'track_stock' => true,
            'stock' => 1,
            'is_active' => true,
            'option_ids' => [$option->id],
        ]);

    $response->assertRedirect(route('variant-items.index', ['product_id' => $product->id]));

    expect($variantItem->refresh())
        ->name->toBe('128GB Midnight')
        ->selling_price->toBe('14600000.00')
        ->image->toBe('variant_items/existing.jpg');

    Storage::disk('public')->assertExists('variant_items/existing.jpg');
});

test('user can create product variant item with an existing media library image path', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $user->is_super_admin = true;

    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'sku' => 'IP15-BASE',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Color',
        'sort_order' => 0,
    ]);

    $option = ProductVariantOption::create([
        'product_variant_id' => $variant->id,
        'value' => 'Media',
        'sort_order' => 0,
    ]);

    Storage::disk('public')->put('media/2026/05/variant.webp', 'image');

    $this
        ->actingAs($user)
        ->post(route('variant-items.store'), [
            'product_id' => $product->id,
            'name' => '128GB Media',
            'sku' => 'IP15-128-MEDIA',
            'image' => 'media/2026/05/variant.webp',
            'selling_price' => 14500000,
            'track_stock' => true,
            'stock' => 0,
            'is_active' => true,
            'option_ids' => [$option->id],
        ])
        ->assertRedirect(route('variant-items.index', ['product_id' => $product->id]));

    expect(VariantItem::query()->where('sku', 'IP15-128-MEDIA')->first()->image)
        ->toBe('media/2026/05/variant.webp');
});

test('product variant item edit page includes the current image path', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'sku' => 'IP15-BASE',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Color',
        'sort_order' => 0,
    ]);

    $option = ProductVariantOption::create([
        'product_variant_id' => $variant->id,
        'value' => 'Black',
        'sort_order' => 0,
    ]);

    $variantItem = VariantItem::create([
        'product_id' => $product->id,
        'name' => '128GB Black',
        'sku' => 'IP15-128-BLK',
        'image' => 'variant_items/existing.jpg',
        'selling_price' => 14500000,
        'stock' => 1,
        'track_stock' => true,
        'is_active' => true,
    ]);
    DB::table('variant_item_options')->insert([
        'id' => (string) Str::uuid(),
        'variant_item_id' => $variantItem->id,
        'product_variant_option_id' => $option->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('variant-items.edit', $variantItem->id));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/VariantItem/Edit')
        ->where('variantItem.image', 'variant_items/existing.jpg')
    );
});
