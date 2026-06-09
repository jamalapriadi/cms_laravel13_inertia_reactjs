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
