<?php

use App\Models\Shop\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Order;
use App\Models\Shop\OrderItem;
use App\Models\Shop\Product;
use App\Models\Shop\ProductCollection;
use App\Models\Shop\ProductCollectionItem;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\VariantItem;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function catalogDetailCreateCategory(array $overrides = []): Category
{
    static $sequence = 0;
    $sequence++;

    return Category::query()->create(array_merge([
        'name' => 'Category '.$sequence,
        'slug' => 'category-'.$sequence,
        'is_publish' => true,
    ], $overrides));
}

function catalogDetailCreateBrand(array $overrides = []): Brand
{
    static $sequence = 0;
    $sequence++;

    return Brand::query()->create(array_merge([
        'name' => 'Brand '.$sequence,
        'slug' => 'brand-'.$sequence,
        'is_active' => true,
    ], $overrides));
}

function catalogDetailCreateProduct(Category $category, ?Brand $brand = null, array $overrides = []): Product
{
    static $sequence = 0;
    $sequence++;

    return Product::query()->create(array_merge([
        'category_id' => $category->id,
        'brand_id' => $brand?->id,
        'name' => 'Product '.$sequence,
        'slug' => 'product-'.$sequence,
        'sku' => 'PRODUCT-'.$sequence,
        'condition' => 'new',
        'base_price' => 100000,
        'has_variant' => false,
        'is_publish' => true,
    ], $overrides));
}

function catalogDetailCreateVariant(Product $product, array $overrides = []): VariantItem
{
    static $sequence = 0;
    $sequence++;

    return VariantItem::query()->create(array_merge([
        'product_id' => $product->id,
        'sku' => 'VARIANT-'.$sequence,
        'name' => 'Variant '.$sequence,
        'buying_price' => 50000,
        'selling_price' => 100000,
        'track_stock' => true,
        'stock' => 0,
        'is_active' => true,
    ], $overrides));
}

function catalogDetailCreateStockUnit(Product $product, ?VariantItem $variantItem = null, array $overrides = []): ProductStockUnit
{
    static $sequence = 0;
    $sequence++;

    return ProductStockUnit::query()->create(array_merge([
        'product_id' => $product->id,
        'product_variant_id' => $variantItem?->id,
        'imei_serial_number' => 'CATALOG-IMEI-'.str_pad((string) $sequence, 10, '0', STR_PAD_LEFT),
        'status' => 'available',
    ], $overrides));
}

function catalogDetailCreateCollection(array $overrides = []): ProductCollection
{
    static $sequence = 0;
    $sequence++;

    return ProductCollection::query()->create(array_merge([
        'name' => 'Collection '.$sequence,
        'slug' => 'collection-'.$sequence,
        'is_active' => true,
    ], $overrides));
}

function catalogDetailAttachCollectionProduct(ProductCollection $collection, Product $product, ?VariantItem $variantItem = null, array $overrides = []): ProductCollectionItem
{
    static $sequence = 0;
    $sequence++;

    return ProductCollectionItem::query()->create(array_merge([
        'product_collection_id' => $collection->id,
        'product_id' => $product->id,
        'variant_item_id' => $variantItem?->id,
        'sort_order' => $sequence,
    ], $overrides));
}

function catalogDetailCreateOrder(string $invoiceNumber, string $paymentStatus = 'paid', string $status = 'completed'): Order
{
    return Order::query()->create([
        'invoice_number' => $invoiceNumber,
        'customer_name' => 'Customer',
        'customer_email' => 'customer@example.com',
        'shipping_address' => 'Jakarta',
        'subtotal' => 100000,
        'shipping_cost' => 0,
        'discount' => 0,
        'grand_total' => 100000,
        'payment_status' => $paymentStatus,
        'status' => $status,
        'paid_at' => $paymentStatus === 'paid' ? now() : null,
    ]);
}

function catalogDetailCreateOrderItem(Order $order, Product $product, int $qty): OrderItem
{
    return OrderItem::query()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'price' => $product->base_price,
        'qty' => $qty,
        'subtotal' => $product->base_price * $qty,
    ]);
}

test('category detail returns parent children and descendant products', function () {
    $brand = catalogDetailCreateBrand([
        'name' => 'Ikea',
        'slug' => 'ikea',
    ]);

    $parent = catalogDetailCreateCategory([
        'name' => 'Office Furniture',
        'slug' => 'office-furniture',
    ]);

    $child = catalogDetailCreateCategory([
        'parent_id' => $parent->id,
        'name' => 'Office Chair',
        'slug' => 'office-chair',
    ]);

    $grandchild = catalogDetailCreateCategory([
        'parent_id' => $child->id,
        'name' => 'Ergonomic Chair',
        'slug' => 'ergonomic-chair',
    ]);

    $otherCategory = catalogDetailCreateCategory([
        'name' => 'Gaming Chair',
        'slug' => 'gaming-chair',
    ]);

    $parentProduct = catalogDetailCreateProduct($parent, $brand, [
        'name' => 'Standing Desk',
        'slug' => 'standing-desk',
        'base_price' => 1500000,
    ]);

    $childProduct = catalogDetailCreateProduct($child, $brand, [
        'name' => 'Executive Chair',
        'slug' => 'executive-chair',
        'base_price' => 800000,
    ]);

    $grandchildProduct = catalogDetailCreateProduct($grandchild, $brand, [
        'name' => 'Lumbar Support Chair',
        'slug' => 'lumbar-support-chair',
        'base_price' => 950000,
        'has_variant' => true,
    ]);

    $variant = catalogDetailCreateVariant($grandchildProduct, [
        'selling_price' => 1000000,
    ]);

    catalogDetailCreateStockUnit($parentProduct);
    catalogDetailCreateStockUnit($childProduct);
    catalogDetailCreateStockUnit($grandchildProduct, $variant);

    catalogDetailCreateProduct($otherCategory, $brand, [
        'name' => 'Racing Chair',
        'slug' => 'racing-chair',
    ]);

    $response = $this->getJson('/api/v1/category/office-furniture?per_page=12');

    $response->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.slug', 'office-furniture')
        ->assertJsonPath('data.parent', null)
        ->assertJsonPath('data.children.0.slug', 'office-chair')
        ->assertJsonPath('data.products.meta.total', 3);

    expect(collect($response->json('data.products.data'))->pluck('slug')->all())
        ->toContain('standing-desk', 'executive-chair', 'lumbar-support-chair')
        ->not->toContain('racing-chair');
});

test('child category detail keeps category locked even when conflicting query parameter is sent', function () {
    $brand = catalogDetailCreateBrand([
        'name' => 'Ikea',
        'slug' => 'ikea',
    ]);

    $parent = catalogDetailCreateCategory([
        'name' => 'Office Furniture',
        'slug' => 'office-furniture',
    ]);

    $child = catalogDetailCreateCategory([
        'parent_id' => $parent->id,
        'name' => 'Office Chair',
        'slug' => 'office-chair',
        'sort_order' => 2,
    ]);

    catalogDetailCreateCategory([
        'parent_id' => $parent->id,
        'name' => 'Office Desk',
        'slug' => 'office-desk',
        'sort_order' => 1,
    ]);

    catalogDetailCreateCategory([
        'parent_id' => $parent->id,
        'name' => 'Storage Cabinet',
        'slug' => 'storage-cabinet',
        'sort_order' => 3,
    ]);

    catalogDetailCreateCategory([
        'parent_id' => $parent->id,
        'name' => 'Hidden Shelf',
        'slug' => 'hidden-shelf',
        'sort_order' => 0,
        'is_publish' => false,
    ]);

    $otherCategory = catalogDetailCreateCategory([
        'name' => 'Gaming Chair',
        'slug' => 'gaming-chair',
    ]);

    catalogDetailCreateProduct($child, $brand, [
        'name' => 'Ergonomic Chair',
        'slug' => 'ergonomic-chair-product',
        'base_price' => 700000,
    ]);

    catalogDetailCreateProduct($otherCategory, $brand, [
        'name' => 'Gaming Throne',
        'slug' => 'gaming-throne',
        'base_price' => 900000,
    ]);

    $response = $this->getJson('/api/v1/category/office-chair?category=gaming-chair&sort=price_asc');

    $response->assertSuccessful()
        ->assertJsonPath('data.slug', 'office-chair')
        ->assertJsonPath('data.parent.slug', 'office-furniture')
        ->assertJsonPath('data.parent.children.0.slug', 'office-desk')
        ->assertJsonPath('data.parent.children.1.slug', 'office-chair')
        ->assertJsonPath('data.parent.children.2.slug', 'storage-cabinet')
        ->assertJsonPath('data.products.meta.total', 1)
        ->assertJsonPath('data.products.data.0.slug', 'ergonomic-chair-product');

    expect(collect($response->json('data.parent.children'))->pluck('slug')->all())
        ->toBe(['office-desk', 'office-chair', 'storage-cabinet']);
});

test('category detail supports best selling sort using paid orders only', function () {
    $brand = catalogDetailCreateBrand([
        'name' => 'Ikea',
        'slug' => 'ikea',
    ]);

    $category = catalogDetailCreateCategory([
        'name' => 'Office Furniture',
        'slug' => 'office-furniture',
    ]);

    $lessSold = catalogDetailCreateProduct($category, $brand, [
        'name' => 'Standard Desk',
        'slug' => 'standard-desk',
        'base_price' => 1200000,
    ]);

    $bestSeller = catalogDetailCreateProduct($category, $brand, [
        'name' => 'Executive Desk',
        'slug' => 'executive-desk',
        'base_price' => 1800000,
    ]);

    catalogDetailCreateOrderItem(catalogDetailCreateOrder('INV-CAT-001'), $lessSold, 1);
    catalogDetailCreateOrderItem(catalogDetailCreateOrder('INV-CAT-002'), $bestSeller, 5);
    catalogDetailCreateOrderItem(catalogDetailCreateOrder('INV-CAT-003', 'pending', 'pending'), $lessSold, 10);

    $response = $this->getJson('/api/v1/category/office-furniture?sort=best_selling');

    $response->assertSuccessful()
        ->assertJsonPath('data.products.data.0.slug', 'executive-desk')
        ->assertJsonPath('data.products.data.0.sold_count', 5);
});

test('brand detail returns products and supports category filter', function () {
    $apple = catalogDetailCreateBrand([
        'name' => 'Apple',
        'slug' => 'apple',
    ]);

    $samsung = catalogDetailCreateBrand([
        'name' => 'Samsung',
        'slug' => 'samsung',
    ]);

    $phones = catalogDetailCreateCategory([
        'name' => 'Phones',
        'slug' => 'phones',
    ]);

    $accessories = catalogDetailCreateCategory([
        'name' => 'Accessories',
        'slug' => 'accessories',
    ]);

    catalogDetailCreateProduct($phones, $apple, [
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
    ]);

    catalogDetailCreateProduct($accessories, $apple, [
        'name' => 'MagSafe Charger',
        'slug' => 'magsafe-charger',
    ]);

    catalogDetailCreateProduct($phones, $samsung, [
        'name' => 'Galaxy S25',
        'slug' => 'galaxy-s25',
    ]);

    $response = $this->getJson('/api/v1/brand/apple?category=phones&per_page=12');

    $response->assertSuccessful()
        ->assertJsonPath('data.slug', 'apple')
        ->assertJsonPath('data.products.meta.total', 1)
        ->assertJsonPath('data.products.data.0.slug', 'iphone-15');
});

test('product collection detail returns collection products with shared stock filter', function () {
    $brand = catalogDetailCreateBrand([
        'name' => 'Ikea',
        'slug' => 'ikea',
    ]);

    $category = catalogDetailCreateCategory([
        'name' => 'Office Furniture',
        'slug' => 'office-furniture',
    ]);

    $collection = catalogDetailCreateCollection([
        'name' => 'Best Office Setup',
        'slug' => 'best-office-setup',
        'banner_image' => 'collections/best-office-setup.webp',
    ]);

    $inStockProduct = catalogDetailCreateProduct($category, $brand, [
        'name' => 'Standing Desk',
        'slug' => 'standing-desk',
        'base_price' => 1500000,
    ]);

    $soldOutProduct = catalogDetailCreateProduct($category, $brand, [
        'name' => 'Office Cabinet',
        'slug' => 'office-cabinet',
        'base_price' => 1200000,
    ]);

    $otherProduct = catalogDetailCreateProduct($category, $brand, [
        'name' => 'Bookshelf',
        'slug' => 'bookshelf',
        'base_price' => 800000,
    ]);

    catalogDetailAttachCollectionProduct($collection, $inStockProduct);
    catalogDetailAttachCollectionProduct($collection, $soldOutProduct);
    catalogDetailAttachCollectionProduct(
        catalogDetailCreateCollection([
            'name' => 'Other Setup',
            'slug' => 'other-setup',
        ]),
        $otherProduct
    );

    catalogDetailCreateStockUnit($inStockProduct);
    catalogDetailCreateStockUnit($soldOutProduct, null, [
        'imei_serial_number' => 'CATALOG-SOLD-OUT-0001',
        'status' => 'sold',
    ]);

    $response = $this->getJson('/api/v1/product-collection/best-office-setup?has_stock=true&sort=price_desc');

    $response->assertSuccessful()
        ->assertJsonPath('data.slug', 'best-office-setup')
        ->assertJsonPath('data.banner_image', fn (string $value) => str_contains($value, 'collections/best-office-setup.webp'))
        ->assertJsonPath('data.products.meta.total', 1)
        ->assertJsonPath('data.products.data.0.slug', 'standing-desk');
});

test('catalog detail endpoints return not found json responses', function (string $url, string $message) {
    $this->getJson($url)
        ->assertNotFound()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', $message);
})->with([
    ['/api/v1/category/missing-category', 'Category not found'],
    ['/api/v1/categories/missing-category', 'Category not found'],
    ['/api/v1/brand/missing-brand', 'Brand not found'],
    ['/api/v1/brands/missing-brand', 'Brand not found'],
    ['/api/v1/product-collection/missing-collection', 'Product collection not found'],
    ['/api/v1/product-collections/missing-collection', 'Product collection not found'],
]);
