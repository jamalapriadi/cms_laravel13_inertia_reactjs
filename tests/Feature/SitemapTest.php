<?php

use App\Models\Page;
use App\Models\Shop\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
    Cache::flush();
    config(['cms_sitemap.enabled' => true]);
});

test('GET /sitemap.xml returns 200 and XML content type', function () {
    $response = $this->get('/sitemap.xml');
    $response->assertStatus(200);
    $response->assertHeader('Content-Type', 'application/xml');
});

test('sitemap index contains correct references', function () {
    config(['cms_sitemap.sitemap_index' => true]);

    Page::create([
        'title' => 'Test Page',
        'slug' => 'test-page',
        'status' => 'publish',
        'published_at' => now(),
    ]);

    $response = $this->get('/sitemap.xml');
    $response->assertSee('/sitemaps/pages.xml');
});

test('sitemap contains homepage URL and published pages but not draft pages', function () {
    config(['cms_sitemap.sitemap_index' => false]);

    $publishedPage = Page::create([
        'title' => 'Published Page',
        'slug' => 'published-page',
        'status' => 'publish',
        'published_at' => now()->subDay(),
    ]);

    $draftPage = Page::create([
        'title' => 'Draft Page',
        'slug' => 'draft-page',
        'status' => 'draft',
        'published_at' => null,
    ]);

    $response = $this->get('/sitemap.xml');
    $response->assertSee(url('/'));
    $response->assertSee(url('/published-page'));
    $response->assertDontSee(url('/draft-page'));
});

test('sitemap contains published products but not unpublished products', function () {
    config(['cms_sitemap.sitemap_index' => false]);

    $category = Category::create([
        'name' => 'Electronic',
        'slug' => 'electronic',
        'is_publish' => true,
    ]);

    $publishedProduct = Product::create([
        'category_id' => $category->id,
        'name' => 'Published Product',
        'slug' => 'published-product',
        'sku' => 'SKU-PUB',
        'is_publish' => true,
        'base_price' => 1000,
    ]);

    $draftProduct = Product::create([
        'category_id' => $category->id,
        'name' => 'Draft Product',
        'slug' => 'draft-product',
        'sku' => 'SKU-DRF',
        'is_publish' => false,
        'base_price' => 2000,
    ]);

    $response = $this->get('/sitemap.xml');
    $response->assertSee(url('/products/published-product'));
    $response->assertDontSee(url('/products/draft-product'));
});

test('sitemap contains active brands and category show page', function () {
    config(['cms_sitemap.sitemap_index' => false]);

    $category = Category::create([
        'name' => 'Electronic',
        'slug' => 'electronic',
        'is_publish' => true,
    ]);

    $brand = Brand::create([
        'name' => 'Active Brand',
        'slug' => 'active-brand',
        'is_active' => true,
    ]);

    $inactiveBrand = Brand::create([
        'name' => 'Inactive Brand',
        'slug' => 'inactive-brand',
        'is_active' => false,
    ]);

    $response = $this->get('/sitemap.xml');
    $response->assertSee(url('/category/electronic'));
    $response->assertSee(url('/brand/active-brand'));
    $response->assertDontSee(url('/brand/inactive-brand'));
});

test('sitemap does not contain soft deleted records', function () {
    config(['cms_sitemap.sitemap_index' => false]);

    $category = Category::create([
        'name' => 'Electronic',
        'slug' => 'electronic',
        'is_publish' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Soft Deleted Product',
        'slug' => 'soft-deleted-product',
        'sku' => 'SKU-SD',
        'is_publish' => true,
        'base_price' => 1000,
    ]);

    $response = $this->get('/sitemap.xml');
    $response->assertSee(url('/products/soft-deleted-product'));

    $product->delete();

    Cache::flush();
    $response2 = $this->get('/sitemap.xml');
    $response2->assertDontSee(url('/products/soft-deleted-product'));
});

test('creating, updating slug/status, and deleting data clears sitemap cache', function () {
    config(['cms_sitemap.use_cache' => true]);

    $page = Page::create([
        'title' => 'Caching Page',
        'slug' => 'caching-page',
        'status' => 'publish',
        'published_at' => now(),
    ]);

    $this->get('/sitemap.xml');
    expect(Cache::has('cms.sitemap.index'))->toBeTrue();

    $newPage = Page::create([
        'title' => 'New Page',
        'slug' => 'new-page',
        'status' => 'publish',
        'published_at' => now(),
    ]);
    expect(Cache::has('cms.sitemap.index'))->toBeFalse();

    $this->get('/sitemap.xml');
    expect(Cache::has('cms.sitemap.index'))->toBeTrue();

    $newPage->update(['slug' => 'new-page-updated']);
    expect(Cache::has('cms.sitemap.index'))->toBeFalse();

    $this->get('/sitemap.xml');
    expect(Cache::has('cms.sitemap.index'))->toBeTrue();

    $newPage->delete();
    expect(Cache::has('cms.sitemap.index'))->toBeFalse();
});

test('robots.txt contains Sitemap URL line', function () {
    $response = $this->get('/robots.txt');
    $response->assertStatus(200);
    $response->assertSee('Sitemap:');
    $response->assertSee('/sitemap.xml');
});

test('artisan sitemap:clear command runs successfully and clears cache', function () {
    Cache::put('cms.sitemap.index', '<xml></xml>');
    expect(Cache::has('cms.sitemap.index'))->toBeTrue();

    Artisan::call('sitemap:clear');

    expect(Cache::has('cms.sitemap.index'))->toBeFalse();
});
