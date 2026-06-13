<?php

use App\Models\Dashboard\Menu;
use App\Models\Dashboard\MenuItem;
use App\Models\Dashboard\MenuItemTranslation;
use App\Models\Shop\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('public menu api returns nested menu tree with dynamic products', function () {
    $brand = Brand::query()->create([
        'name' => 'Apple',
        'slug' => 'apple',
        'is_active' => true,
    ]);

    $phoneCategory = Category::query()->create([
        'name' => 'Phone',
        'slug' => 'phone',
        'is_publish' => true,
    ]);

    $otherCategory = Category::query()->create([
        'name' => 'Laptop',
        'slug' => 'laptop',
        'is_publish' => true,
    ]);

    $olderProduct = Product::query()->create([
        'category_id' => $phoneCategory->id,
        'brand_id' => $brand->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'sku' => 'IP15',
        'thumbnail' => 'products/iphone-15.webp',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    $olderProduct->forceFill([
        'created_at' => now()->subDay(),
        'updated_at' => now()->subDay(),
    ])->saveQuietly();

    $latestProduct = Product::query()->create([
        'category_id' => $phoneCategory->id,
        'brand_id' => $brand->id,
        'name' => 'iPhone 16',
        'slug' => 'iphone-16',
        'sku' => 'IP16',
        'thumbnail' => 'products/iphone-16.webp',
        'condition' => 'new',
        'base_price' => 16000000,
        'is_publish' => true,
    ]);

    $otherCategoryProduct = Product::query()->create([
        'category_id' => $otherCategory->id,
        'brand_id' => $brand->id,
        'name' => 'MacBook Air',
        'slug' => 'macbook-air',
        'sku' => 'MBA',
        'thumbnail' => 'products/macbook-air.webp',
        'condition' => 'new',
        'base_price' => 21000000,
        'is_publish' => true,
    ]);

    $menu = Menu::query()->create([
        'name' => 'Main Menu',
        'slug' => 'main-menu',
    ]);

    $dropdown = MenuItem::query()->create([
        'menu_id' => $menu->id,
        'type' => 'dropdown',
        'target' => '_self',
        'meta' => [
            'dropdown_layout' => 'mega_menu',
            'columns' => 4,
        ],
    ]);

    MenuItemTranslation::query()->create([
        'menu_item_id' => $dropdown->id,
        'locale' => 'id',
        'title' => 'Produk',
    ]);

    $dynamic = MenuItem::query()->create([
        'menu_id' => $menu->id,
        'parent_id' => $dropdown->id,
        'type' => 'dynamic',
        'target' => '_self',
        'meta' => [
            'source' => 'products',
            'filter' => [
                'category_id' => $phoneCategory->id,
            ],
            'limit' => 1,
            'sort' => 'latest',
            'layout' => 'product_grid',
            'show_image' => true,
            'show_price' => true,
        ],
    ]);

    MenuItemTranslation::query()->create([
        'menu_item_id' => $dynamic->id,
        'locale' => 'id',
        'title' => 'Produk Pilihan',
    ]);

    $response = $this->getJson('/api/v1/menus/main-menu?locale=en');

    $response->assertSuccessful();
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('data.name', 'Main Menu');
    $response->assertJsonPath('data.slug', 'main-menu');
    $response->assertJsonPath('data.items.0.title', 'Produk');
    $response->assertJsonPath('data.items.0.type', 'dropdown');
    $response->assertJsonPath('data.items.0.children.0.title', 'Produk Pilihan');
    $response->assertJsonPath('data.items.0.children.0.type', 'dynamic');
    $response->assertJsonCount(1, 'data.items.0.children.0.items');
    $response->assertJsonPath('data.items.0.children.0.items.0.slug', $latestProduct->slug);
    $response->assertJsonPath('data.items.0.children.0.items.0.url', '/products/'.$latestProduct->slug);

    expect((float) $response->json('data.items.0.children.0.items.0.price'))->toEqual(16000000.0);
    expect($response->json('data.items.0.children.0.items.0.image'))->toContain('products/iphone-16.webp');

    expect($olderProduct->slug)->not->toBe($latestProduct->slug);
    expect($otherCategoryProduct->slug)->not->toBe($latestProduct->slug);
});

test('public menu api handles invalid dynamic category filters safely', function () {
    $menu = Menu::query()->create([
        'name' => 'Main Menu',
        'slug' => 'main-menu',
    ]);

    $dynamic = MenuItem::query()->create([
        'menu_id' => $menu->id,
        'type' => 'dynamic',
        'target' => '_self',
        'meta' => [
            'source' => 'products',
            'filter' => [
                'category_id' => 'not-a-real-category-id',
            ],
            'limit' => 6,
            'sort' => 'latest',
            'layout' => 'product_grid',
        ],
    ]);

    MenuItemTranslation::query()->create([
        'menu_item_id' => $dynamic->id,
        'locale' => 'id',
        'title' => 'Produk Kosong',
    ]);

    $response = $this->getJson('/api/v1/menus/main-menu?locale=id');

    $response->assertSuccessful();
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('data.items.0.title', 'Produk Kosong');
    $response->assertJsonPath('data.items.0.type', 'dynamic');
    $response->assertJsonCount(0, 'data.items.0.items');
});

test('public menu api returns category details for dynamic_products type', function () {
    $parentCategory = Category::query()->create([
        'name' => 'Phone',
        'slug' => 'phone',
        'is_publish' => true,
    ]);

    $childCategory = Category::query()->create([
        'parent_id' => $parentCategory->id,
        'name' => 'iPhone',
        'slug' => 'iphone',
        'is_publish' => true,
    ]);

    $menu = Menu::query()->create([
        'name' => 'Main Menu',
        'slug' => 'main-menu',
    ]);

    $dynamic = MenuItem::query()->create([
        'menu_id' => $menu->id,
        'type' => 'dynamic_products',
        'target' => '_self',
        'meta' => [
            'source' => 'products',
            'filter' => [
                'category_id' => $childCategory->id,
            ],
            'limit' => 6,
            'sort' => 'latest',
            'layout' => 'product_grid',
        ],
    ]);

    MenuItemTranslation::query()->create([
        'menu_item_id' => $dynamic->id,
        'locale' => 'id',
        'title' => 'Produk Apple',
    ]);

    $response = $this->getJson('/api/v1/menus/main-menu?locale=id');

    $response->assertSuccessful();
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('data.items.0.title', 'Produk Apple');
    $response->assertJsonPath('data.items.0.type', 'dynamic_products');
    $response->assertJsonPath('data.items.0.category.id', $childCategory->id);
    $response->assertJsonPath('data.items.0.category.name', 'iPhone');
    $response->assertJsonPath('data.items.0.category.slug', 'iphone');
    $response->assertJsonPath('data.items.0.category.parent.id', $parentCategory->id);
    $response->assertJsonPath('data.items.0.category.parent.name', 'Phone');
    $response->assertJsonPath('data.items.0.category.parent.slug', 'phone');
});

test('public menu api returns resolved categories when type is dynamic and source is categories', function () {
    $cat1 = Category::query()->create([
        'name' => 'Laptops',
        'slug' => 'laptops',
        'is_publish' => true,
    ]);

    $cat2 = Category::query()->create([
        'name' => 'Phones',
        'slug' => 'phones',
        'is_publish' => true,
    ]);

    $menu = Menu::query()->create([
        'name' => 'Main Menu',
        'slug' => 'main-menu',
    ]);

    $dynamic = MenuItem::query()->create([
        'menu_id' => $menu->id,
        'type' => 'dynamic',
        'target' => '_self',
        'meta' => [
            'source' => 'categories',
            'filter' => [
                'category_ids' => [$cat1->id, $cat2->id],
            ],
        ],
    ]);

    MenuItemTranslation::query()->create([
        'menu_item_id' => $dynamic->id,
        'locale' => 'id',
        'title' => 'Daftar Kategori',
    ]);

    $response = $this->getJson('/api/v1/menus/main-menu?locale=id');

    $response->assertSuccessful();
    $response->assertJsonPath('success', true);
    $response->assertJsonPath('data.items.0.title', 'Daftar Kategori');
    $response->assertJsonPath('data.items.0.type', 'dynamic');
    $response->assertJsonCount(2, 'data.items.0.items');
    $response->assertJsonPath('data.items.0.items.0.id', $cat1->id);
    $response->assertJsonPath('data.items.0.items.0.name', 'Laptops');
    $response->assertJsonPath('data.items.0.items.0.slug', 'laptops');
    $response->assertJsonPath('data.items.0.items.0.url', '/category/laptops');
    $response->assertJsonPath('data.items.0.items.1.id', $cat2->id);
    $response->assertJsonPath('data.items.0.items.1.name', 'Phones');
    $response->assertJsonPath('data.items.0.items.1.slug', 'phones');
    $response->assertJsonPath('data.items.0.items.1.url', '/category/phones');
});

test('public menu api resolves images and external URLs correctly for dynamic products and categories', function () {
    $brand = Brand::query()->create([
        'name' => 'Apple',
        'slug' => 'apple',
        'is_active' => true,
    ]);

    // 1. Create categories with relative path and external URL
    $catRelative = Category::query()->create([
        'name' => 'Laptops',
        'slug' => 'laptops',
        'image' => 'categories/laptops.png',
        'is_publish' => true,
    ]);

    $catExternal = Category::query()->create([
        'name' => 'Phones',
        'slug' => 'phones',
        'image' => 'https://via.placeholder.com/150',
        'is_publish' => true,
    ]);

    // 2. Create products with relative path and external URL
    $productRelative = Product::query()->create([
        'category_id' => $catRelative->id,
        'brand_id' => $brand->id,
        'name' => 'MacBook Air',
        'slug' => 'macbook-air',
        'sku' => 'MBA',
        'thumbnail' => 'products/macbook-air.webp',
        'condition' => 'new',
        'base_price' => 21000000,
        'is_publish' => true,
    ]);

    $productExternal = Product::query()->create([
        'category_id' => $catExternal->id,
        'brand_id' => $brand->id,
        'name' => 'iPhone 16',
        'slug' => 'iphone-16',
        'sku' => 'IP16',
        'thumbnail' => 'https://via.placeholder.com/640x480.png',
        'condition' => 'new',
        'base_price' => 16000000,
        'is_publish' => true,
    ]);

    $menu = Menu::query()->create([
        'name' => 'Main Menu',
        'slug' => 'main-menu',
    ]);

    // Add Dynamic Categories item
    $dynamicCat = MenuItem::query()->create([
        'menu_id' => $menu->id,
        'type' => 'dynamic',
        'target' => '_self',
        'meta' => [
            'source' => 'categories',
            'filter' => [
                'category_ids' => [$catRelative->id, $catExternal->id],
            ],
        ],
    ]);

    MenuItemTranslation::query()->create([
        'menu_item_id' => $dynamicCat->id,
        'locale' => 'id',
        'title' => 'Kategori Pilihan',
    ]);

    // Add Dynamic Products item
    $dynamicProd = MenuItem::query()->create([
        'menu_id' => $menu->id,
        'type' => 'dynamic',
        'target' => '_self',
        'meta' => [
            'source' => 'products',
            'filter' => [
                'category_id' => $catRelative->id,
            ],
            'limit' => 6,
            'sort' => 'latest',
        ],
    ]);

    MenuItemTranslation::query()->create([
        'menu_item_id' => $dynamicProd->id,
        'locale' => 'id',
        'title' => 'Produk Pilihan 1',
    ]);

    $dynamicProdExt = MenuItem::query()->create([
        'menu_id' => $menu->id,
        'type' => 'dynamic',
        'target' => '_self',
        'meta' => [
            'source' => 'products',
            'filter' => [
                'category_id' => $catExternal->id,
            ],
            'limit' => 6,
            'sort' => 'latest',
        ],
    ]);

    MenuItemTranslation::query()->create([
        'menu_item_id' => $dynamicProdExt->id,
        'locale' => 'id',
        'title' => 'Produk Pilihan 2',
    ]);

    $response = $this->getJson('/api/v1/menus/main-menu?locale=id');

    $response->assertSuccessful();

    // Assert Categories Images
    // First dynamic item (Kategori Pilihan) has two resolved categories
    $response->assertJsonPath('data.items.0.title', 'Kategori Pilihan');
    $response->assertJsonCount(2, 'data.items.0.items');
    expect($response->json('data.items.0.items.0.image'))->toContain('storage/categories/laptops.png');
    expect($response->json('data.items.0.items.1.image'))->toBe('https://via.placeholder.com/150');

    // Assert Products Images
    // Second dynamic item (Produk Pilihan 1)
    $response->assertJsonPath('data.items.1.title', 'Produk Pilihan 1');
    expect($response->json('data.items.1.items.0.image'))->toContain('storage/products/macbook-air.webp');

    // Third dynamic item (Produk Pilihan 2)
    $response->assertJsonPath('data.items.2.title', 'Produk Pilihan 2');
    expect($response->json('data.items.2.items.0.image'))->toBe('https://via.placeholder.com/640x480.png');
});
