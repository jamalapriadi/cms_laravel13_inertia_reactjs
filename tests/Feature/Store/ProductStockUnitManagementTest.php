<?php

use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\VariantItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createStockUnitVariant(): VariantItem
{
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
        'has_variant' => true,
    ]);

    return VariantItem::create([
        'product_id' => $product->id,
        'name' => '128GB Black',
        'sku' => 'IP15-128-BLK',
        'selling_price' => 14500000,
        'stock' => 0,
        'track_stock' => true,
        'is_active' => true,
    ]);
}

test('authenticated user can view stock unit list with product and variant names plus summary', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

    $variant = createStockUnitVariant();

    ProductStockUnit::create([
        'product_id' => $variant->product_id,
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '351234567890123',
        'status' => 'available',
    ]);

    ProductStockUnit::create([
        'product_id' => $variant->product_id,
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '990000862471854',
        'status' => 'sold',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('product-stock-units.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/ProductStockUnit/Index')
        ->where('summary.products', 1)
        ->where('summary.product_variants', 1)
        ->where('summary.stock_units', 2)
        ->where('summary.available_stock_units', 1)
        ->where('summary.non_available_stock_units', 1)
        ->where('stockUnits.data.0.variant.product.name', 'iPhone 15')
    );

    $response->assertSee('iPhone 15');
    $response->assertSee('128GB Black');
    $response->assertSee('351234567890123');
});

test('user can filter stock units by status and search imei', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;

    $variant = createStockUnitVariant();

    ProductStockUnit::create([
        'product_id' => $variant->product_id,
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '351234567890123',
        'status' => 'available',
    ]);

    ProductStockUnit::create([
        'product_id' => $variant->product_id,
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '990000862471854',
        'status' => 'sold',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('product-stock-units.index', [
            'status' => 'sold',
            'search' => '990000862471854',
        ]));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/ProductStockUnit/Index')
        ->has('stockUnits.data', 1)
        ->where('stockUnits.data.0.imei_serial_number', '990000862471854')
    );
});

test('authenticated user can open create stock unit page', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;
    $variant = createStockUnitVariant();

    $response = $this
        ->actingAs($user)
        ->get(route('product-stock-units.create'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/ProductStockUnit/Create')
        ->has('products', 1)
        ->where('products.0.id', $variant->product_id)
        ->where('products.0.variant_items.0.id', $variant->id)
        ->where('products.0.variant_items.0.name', '128GB Black')
    );
});

test('authenticated user can create stock unit and variant stock is synced', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;
    $variant = createStockUnitVariant();

    $response = $this
        ->actingAs($user)
        ->from(route('product-stock-units.create'))
        ->post(route('product-stock-units.store'), [
            'product_id' => $variant->product_id,
            'product_variant_id' => $variant->id,
            'imei_serial_number' => '351234567890123',
            'status' => 'available',
            'note' => 'Box sealed',
        ]);

    $response->assertRedirect(route('product-stock-units.index'));

    $this->assertDatabaseHas('product_stock_units', [
        'product_id' => $variant->product_id,
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '351234567890123',
        'status' => 'available',
    ]);

    expect($variant->refresh()->stock)->toBe(1);
});

test('authenticated user can create stock unit with null serial number', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;
    $variant = createStockUnitVariant();

    $response = $this
        ->actingAs($user)
        ->from(route('product-stock-units.create'))
        ->post(route('product-stock-units.store'), [
            'product_id' => $variant->product_id,
            'product_variant_id' => $variant->id,
            'imei_serial_number' => null,
            'status' => 'available',
        ]);

    $response->assertRedirect(route('product-stock-units.index'));

    $this->assertDatabaseHas('product_stock_units', [
        'product_id' => $variant->product_id,
        'product_variant_id' => $variant->id,
        'imei_serial_number' => null,
        'status' => 'available',
    ]);
});

test('authenticated user can view stock unit detail page', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;
    $variant = createStockUnitVariant();

    $stockUnit = ProductStockUnit::create([
        'product_id' => $variant->product_id,
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '351234567890123',
        'status' => 'available',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('product-stock-units.show', $stockUnit));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/ProductStockUnit/Show')
        ->where('stockUnit.imei_serial_number', '351234567890123')
        ->where('stockUnit.variant.name', '128GB Black')
        ->where('stockUnit.variant.product.name', 'iPhone 15')
    );
});

test('authenticated user can open edit stock unit page', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;
    $variant = createStockUnitVariant();

    $stockUnit = ProductStockUnit::create([
        'product_id' => $variant->product_id,
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '351234567890123',
        'status' => 'available',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('product-stock-units.edit', $stockUnit));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/ProductStockUnit/Edit')
        ->where('stockUnit.id', $stockUnit->id)
        ->where('stockUnit.imei_serial_number', '351234567890123')
        ->has('products', 1)
    );
});

test('authenticated user can update stock unit and variant stock is synced', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;
    $variant = createStockUnitVariant();

    $stockUnit = ProductStockUnit::create([
        'product_id' => $variant->product_id,
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '351234567890123',
        'status' => 'available',
    ]);

    $variant->syncStockFromUnits();

    expect($variant->refresh()->stock)->toBe(1);

    $response = $this
        ->actingAs($user)
        ->from(route('product-stock-units.edit', $stockUnit))
        ->put(route('product-stock-units.update', $stockUnit), [
            'product_id' => $variant->product_id,
            'product_variant_id' => $variant->id,
            'imei_serial_number' => '351234567890123-updated',
            'status' => 'sold',
            'note' => 'Sold from dashboard',
        ]);

    $response->assertRedirect(route('product-stock-units.index'));

    $this->assertDatabaseHas('product_stock_units', [
        'id' => $stockUnit->id,
        'imei_serial_number' => '351234567890123-updated',
        'status' => 'sold',
    ]);

    expect($variant->refresh()->stock)->toBe(0);
});

test('authenticated user can delete stock unit and variant stock is synced', function () {
    $user = User::factory()->create();
    $user->is_super_admin = true;
    $variant = createStockUnitVariant();

    $stockUnit = ProductStockUnit::create([
        'product_id' => $variant->product_id,
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '351234567890123',
        'status' => 'available',
    ]);

    $variant->syncStockFromUnits();

    expect($variant->refresh()->stock)->toBe(1);

    $response = $this
        ->actingAs($user)
        ->delete(route('product-stock-units.destroy', $stockUnit));

    $response->assertRedirect();

    $this->assertSoftDeleted('product_stock_units', [
        'id' => $stockUnit->id,
    ]);

    expect($variant->refresh()->stock)->toBe(0);
});
