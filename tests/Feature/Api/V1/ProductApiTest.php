<?php

use App\Models\Shop\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\VariantItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Testing\TestResponse;

uses(RefreshDatabase::class);

function createProductCatalogCategory(): Category
{
    return Category::query()->create([
        'name' => 'Phones',
        'slug' => 'phones',
        'is_publish' => true,
    ]);
}

function createProductCatalogBrand(): Brand
{
    return Brand::query()->create([
        'name' => 'Apple',
        'slug' => 'apple',
        'is_active' => true,
    ]);
}

function createPublicProduct(Category $category, Brand $brand, array $overrides = []): Product
{
    static $sequence = 0;
    $sequence++;

    return Product::query()->create(array_merge([
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'Product '.$sequence,
        'slug' => 'product-'.$sequence,
        'sku' => 'SKU-'.$sequence,
        'condition' => 'new',
        'base_price' => 100000,
        'has_variant' => false,
        'is_publish' => true,
    ], $overrides));
}

function createVariantItemForProduct(Product $product, array $overrides = []): VariantItem
{
    static $sequence = 0;
    $sequence++;

    return VariantItem::query()->create(array_merge([
        'product_id' => $product->id,
        'sku' => 'VAR-'.$sequence,
        'name' => 'Variant '.$sequence,
        'buying_price' => 50000,
        'selling_price' => 100000,
        'track_stock' => true,
        'stock' => 0,
        'is_active' => true,
    ], $overrides));
}

function createStockUnitForProduct(Product $product, ?VariantItem $variantItem = null, array $overrides = []): ProductStockUnit
{
    static $sequence = 0;
    $sequence++;

    return ProductStockUnit::query()->create(array_merge([
        'product_id' => $product->id,
        'product_variant_id' => $variantItem?->id,
        'imei_serial_number' => 'IMEI-'.str_pad((string) $sequence, 10, '0', STR_PAD_LEFT),
        'status' => 'available',
    ], $overrides));
}

function productPayloadBySlug(TestResponse $response): Collection
{
    return collect($response->json('data'))->keyBy('slug');
}

test('public products api returns frontend price and stock aggregates for base and variant products', function () {
    $category = createProductCatalogCategory();
    $brand = createProductCatalogBrand();

    $baseProduct = createPublicProduct($category, $brand, [
        'name' => 'Base Phone',
        'slug' => 'base-phone',
        'sku' => 'BASE-PHONE',
        'base_price' => 120000,
    ]);

    createStockUnitForProduct($baseProduct);
    createStockUnitForProduct($baseProduct, overrides: [
        'imei_serial_number' => 'IMEI-BASE-SOLD',
        'status' => 'sold',
    ]);

    $variantProduct = createPublicProduct($category, $brand, [
        'name' => 'Variant Phone',
        'slug' => 'variant-phone',
        'sku' => 'VARIANT-PHONE',
        'base_price' => 999999,
        'has_variant' => true,
    ]);

    $lowVariant = createVariantItemForProduct($variantProduct, [
        'name' => '128 GB',
        'sku' => 'VAR-LOW',
        'selling_price' => 100000,
    ]);

    $highVariant = createVariantItemForProduct($variantProduct, [
        'name' => '256 GB',
        'sku' => 'VAR-HIGH',
        'selling_price' => 300000,
    ]);

    $inactiveVariant = createVariantItemForProduct($variantProduct, [
        'name' => '512 GB',
        'sku' => 'VAR-INACTIVE',
        'selling_price' => 500000,
        'is_active' => false,
    ]);

    createStockUnitForProduct($variantProduct, $lowVariant);
    createStockUnitForProduct($variantProduct, $highVariant, [
        'imei_serial_number' => 'IMEI-VAR-SOLD',
        'status' => 'sold',
    ]);
    createStockUnitForProduct($variantProduct, $inactiveVariant, [
        'imei_serial_number' => 'IMEI-VAR-INACTIVE',
        'status' => 'available',
    ]);

    $soldOutProduct = createPublicProduct($category, $brand, [
        'name' => 'Sold Out Phone',
        'slug' => 'sold-out-phone',
        'sku' => 'SOLD-OUT',
        'base_price' => 180000,
    ]);

    createStockUnitForProduct($soldOutProduct, overrides: [
        'imei_serial_number' => 'IMEI-SOLD-OUT',
        'status' => 'sold',
    ]);

    $response = $this->getJson('/api/v1/products');

    $response->assertSuccessful()
        ->assertJsonPath('success', true);

    $products = productPayloadBySlug($response);

    expect($products->get('base-phone')['min_price'])->toEqual(120000.0);
    expect($products->get('base-phone')['max_price'])->toEqual(120000.0);
    expect($products->get('base-phone')['selling_price'])->toEqual(120000.0);
    expect($products->get('base-phone')['stock_total'])->toBe(1);
    expect($products->get('base-phone')['has_stock'])->toBeTrue();

    expect($products->get('variant-phone')['min_price'])->toEqual(100000.0);
    expect($products->get('variant-phone')['max_price'])->toEqual(300000.0);
    expect($products->get('variant-phone')['selling_price'])->toEqual(100000.0);
    expect($products->get('variant-phone')['stock_total'])->toBe(1);
    expect($products->get('variant-phone')['has_stock'])->toBeTrue();

    expect($products->get('sold-out-phone')['stock_total'])->toBe(0);
    expect($products->get('sold-out-phone')['has_stock'])->toBeFalse();
});

test('public products api filters price range using actual customer-facing prices', function () {
    $category = createProductCatalogCategory();
    $brand = createProductCatalogBrand();

    createPublicProduct($category, $brand, [
        'name' => 'Base Phone',
        'slug' => 'base-phone',
        'sku' => 'BASE-PHONE',
        'base_price' => 120000,
    ]);

    $wideRangeProduct = createPublicProduct($category, $brand, [
        'name' => 'Wide Range Phone',
        'slug' => 'wide-range-phone',
        'sku' => 'WIDE-RANGE',
        'base_price' => 999999,
        'has_variant' => true,
    ]);

    createVariantItemForProduct($wideRangeProduct, [
        'name' => '128 GB',
        'sku' => 'WIDE-LOW',
        'selling_price' => 100000,
    ]);

    createVariantItemForProduct($wideRangeProduct, [
        'name' => '512 GB',
        'sku' => 'WIDE-HIGH',
        'selling_price' => 300000,
    ]);

    $inRangeProduct = createPublicProduct($category, $brand, [
        'name' => 'In Range Phone',
        'slug' => 'in-range-phone',
        'sku' => 'IN-RANGE',
        'base_price' => 999999,
        'has_variant' => true,
    ]);

    createVariantItemForProduct($inRangeProduct, [
        'name' => '256 GB',
        'sku' => 'IN-RANGE-ONE',
        'selling_price' => 200000,
    ]);

    createVariantItemForProduct($inRangeProduct, [
        'name' => '512 GB',
        'sku' => 'IN-RANGE-TWO',
        'selling_price' => 220000,
    ]);

    $response = $this->getJson('/api/v1/products?min_price=150000&max_price=250000');

    $response->assertSuccessful()
        ->assertJsonPath('success', true);

    expect(collect($response->json('data'))->pluck('slug')->all())
        ->toBe(['in-range-phone']);
});

test('public products api sorts by analyzed catalog prices', function () {
    $category = createProductCatalogCategory();
    $brand = createProductCatalogBrand();

    createPublicProduct($category, $brand, [
        'name' => 'Base Phone',
        'slug' => 'base-phone',
        'sku' => 'BASE-PHONE',
        'base_price' => 120000,
    ]);

    $wideRangeProduct = createPublicProduct($category, $brand, [
        'name' => 'Wide Range Phone',
        'slug' => 'wide-range-phone',
        'sku' => 'WIDE-RANGE',
        'base_price' => 999999,
        'has_variant' => true,
    ]);

    createVariantItemForProduct($wideRangeProduct, [
        'name' => '128 GB',
        'sku' => 'WIDE-LOW',
        'selling_price' => 100000,
    ]);

    createVariantItemForProduct($wideRangeProduct, [
        'name' => '512 GB',
        'sku' => 'WIDE-HIGH',
        'selling_price' => 300000,
    ]);

    $midRangeProduct = createPublicProduct($category, $brand, [
        'name' => 'Mid Range Phone',
        'slug' => 'mid-range-phone',
        'sku' => 'MID-RANGE',
        'base_price' => 999999,
        'has_variant' => true,
    ]);

    createVariantItemForProduct($midRangeProduct, [
        'name' => '256 GB',
        'sku' => 'MID-RANGE-ONE',
        'selling_price' => 200000,
    ]);

    createVariantItemForProduct($midRangeProduct, [
        'name' => '512 GB',
        'sku' => 'MID-RANGE-TWO',
        'selling_price' => 220000,
    ]);

    $ascendingResponse = $this->getJson('/api/v1/products?sort=price_asc');
    $descendingResponse = $this->getJson('/api/v1/products?sort=price_desc');

    $ascendingResponse->assertSuccessful();
    $descendingResponse->assertSuccessful();

    expect(collect($ascendingResponse->json('data'))->pluck('slug')->all())
        ->toBe(['wide-range-phone', 'base-phone', 'mid-range-phone']);

    expect(collect($descendingResponse->json('data'))->pluck('slug')->all())
        ->toBe(['wide-range-phone', 'mid-range-phone', 'base-phone']);
});

test('public products api filters by aggregated stock availability', function () {
    $category = createProductCatalogCategory();
    $brand = createProductCatalogBrand();

    $baseProduct = createPublicProduct($category, $brand, [
        'name' => 'Base Phone',
        'slug' => 'base-phone',
        'sku' => 'BASE-PHONE',
        'base_price' => 120000,
    ]);

    createStockUnitForProduct($baseProduct);

    $variantProduct = createPublicProduct($category, $brand, [
        'name' => 'Variant Phone',
        'slug' => 'variant-phone',
        'sku' => 'VARIANT-PHONE',
        'base_price' => 999999,
        'has_variant' => true,
    ]);

    $activeVariant = createVariantItemForProduct($variantProduct, [
        'name' => '128 GB',
        'sku' => 'VAR-ACTIVE',
        'selling_price' => 100000,
    ]);

    $inactiveVariant = createVariantItemForProduct($variantProduct, [
        'name' => '512 GB',
        'sku' => 'VAR-INACTIVE',
        'selling_price' => 250000,
        'is_active' => false,
    ]);

    createStockUnitForProduct($variantProduct, $activeVariant);
    createStockUnitForProduct($variantProduct, $inactiveVariant, [
        'imei_serial_number' => 'IMEI-INACTIVE-STOCK',
        'status' => 'available',
    ]);

    $soldOutProduct = createPublicProduct($category, $brand, [
        'name' => 'Sold Out Phone',
        'slug' => 'sold-out-phone',
        'sku' => 'SOLD-OUT',
        'base_price' => 180000,
    ]);

    createStockUnitForProduct($soldOutProduct, overrides: [
        'imei_serial_number' => 'IMEI-SOLD-OUT',
        'status' => 'sold',
    ]);

    $response = $this->getJson('/api/v1/products?has_stock=true');

    $response->assertSuccessful()
        ->assertJsonPath('success', true);

    expect(collect($response->json('data'))->pluck('slug')->all())
        ->toBe(['variant-phone', 'base-phone']);
});
