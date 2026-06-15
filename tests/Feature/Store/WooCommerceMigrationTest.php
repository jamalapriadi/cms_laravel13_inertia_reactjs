<?php

use App\Models\Shop\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductImage;
use App\Models\Shop\ProductStockUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

beforeEach(function () {
    // 1. Setup in-memory SQLite database connection for 'wordpress'
    config(['database.connections.wordpress' => [
        'driver' => 'sqlite',
        'database' => ':memory:',
        'prefix' => 'wpzo_',
    ]]);

    $schema = Schema::connection('wordpress');

    // 2. Create mock WordPress tables
    $schema->create('posts', function ($table) {
        $table->bigIncrements('ID');
        $table->string('post_title');
        $table->string('post_name');
        $table->longText('post_content');
        $table->text('post_excerpt');
        $table->string('post_status');
        $table->string('post_type');
        $table->string('post_mime_type')->nullable();
        $table->timestamp('post_date')->nullable();
        $table->timestamp('post_modified')->nullable();
        $table->unsignedBigInteger('post_author');
    });

    $schema->create('postmeta', function ($table) {
        $table->bigIncrements('meta_id');
        $table->unsignedBigInteger('post_id');
        $table->string('meta_key');
        $table->longText('meta_value')->nullable();
    });

    $schema->create('terms', function ($table) {
        $table->bigIncrements('term_id');
        $table->string('name');
        $table->string('slug');
    });

    $schema->create('term_taxonomy', function ($table) {
        $table->bigIncrements('term_taxonomy_id');
        $table->unsignedBigInteger('term_id');
        $table->string('taxonomy');
        $table->text('description')->nullable();
        $table->unsignedBigInteger('parent')->default(0);
        $table->unsignedInteger('count')->default(0);
    });

    $schema->create('term_relationships', function ($table) {
        $table->unsignedBigInteger('object_id');
        $table->unsignedBigInteger('term_taxonomy_id');
        $table->primary(['object_id', 'term_taxonomy_id']);
    });

    $schema->create('users', function ($table) {
        $table->bigIncrements('ID');
        $table->string('user_login');
        $table->string('user_email');
    });

    // 3. Setup local default admin user
    $this->user = User::factory()->create([
        'email' => 'admin@safartranss.com',
    ]);
});

afterEach(function () {
    Schema::connection('wordpress')->dropIfExists('posts');
    Schema::connection('wordpress')->dropIfExists('postmeta');
    Schema::connection('wordpress')->dropIfExists('terms');
    Schema::connection('wordpress')->dropIfExists('term_taxonomy');
    Schema::connection('wordpress')->dropIfExists('term_relationships');
    Schema::connection('wordpress')->dropIfExists('users');
});

test('woocommerce migration connection check passes', function () {
    $this->artisan('woo:migrate-products --dry-run')
        ->assertExitCode(0);
});

test('woocommerce migration in dry-run mode does not modify laravel tables', function () {
    // Seed WordPress Brand
    DB::connection('wordpress')->table('terms')->insert([
        'term_id' => 10,
        'name' => 'Brand Test',
        'slug' => 'brand-test',
    ]);
    DB::connection('wordpress')->table('term_taxonomy')->insert([
        'term_taxonomy_id' => 10,
        'term_id' => 10,
        'taxonomy' => 'product_brand',
        'parent' => 0,
    ]);

    // Seed WordPress Category
    DB::connection('wordpress')->table('terms')->insert([
        'term_id' => 20,
        'name' => 'Category Test',
        'slug' => 'category-test',
    ]);
    DB::connection('wordpress')->table('term_taxonomy')->insert([
        'term_taxonomy_id' => 20,
        'term_id' => 20,
        'taxonomy' => 'product_cat',
        'parent' => 0,
    ]);

    // Seed WordPress Product
    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 100,
        'post_title' => 'Product Test',
        'post_name' => 'product-test',
        'post_content' => 'Description test',
        'post_excerpt' => 'Excerpt test',
        'post_status' => 'publish',
        'post_type' => 'product',
        'post_author' => 1,
    ]);
    DB::connection('wordpress')->table('postmeta')->insert([
        ['post_id' => 100, 'meta_key' => '_price', 'meta_value' => '150000'],
        ['post_id' => 100, 'meta_key' => '_sku', 'meta_value' => 'PROD-100'],
        ['post_id' => 100, 'meta_key' => '_manage_stock', 'meta_value' => 'yes'],
        ['post_id' => 100, 'meta_key' => '_stock', 'meta_value' => '5'],
    ]);
    DB::connection('wordpress')->table('term_relationships')->insert([
        ['object_id' => 100, 'term_taxonomy_id' => 20],
        ['object_id' => 100, 'term_taxonomy_id' => 10],
    ]);

    $this->artisan('woo:migrate-products --dry-run')
        ->expectsOutputToContain('[DRY-RUN] Starting WooCommerce migration...')
        ->assertExitCode(0);

    expect(Brand::count())->toBe(0);
    expect(Category::count())->toBe(0);
    expect(Product::count())->toBe(0);
    expect(ProductStockUnit::count())->toBe(0);
    expect(DB::table('wordpress_migration_maps')->count())->toBe(0);
});

test('woocommerce migration successfully migrates categories, brands, products, images, and stock', function () {
    // 1. Seed brand
    DB::connection('wordpress')->table('terms')->insert([
        'term_id' => 11,
        'name' => 'Brand Test Actual',
        'slug' => 'brand-test-actual',
    ]);
    DB::connection('wordpress')->table('term_taxonomy')->insert([
        'term_taxonomy_id' => 11,
        'term_id' => 11,
        'taxonomy' => 'pa_brand', // using second priority taxonomy
        'parent' => 0,
    ]);

    // 2. Seed category
    DB::connection('wordpress')->table('terms')->insert([
        'term_id' => 21,
        'name' => 'Category Test Actual',
        'slug' => 'category-test-actual',
    ]);
    DB::connection('wordpress')->table('term_taxonomy')->insert([
        'term_taxonomy_id' => 21,
        'term_id' => 21,
        'taxonomy' => 'product_cat',
        'parent' => 0,
    ]);

    // 3. Seed product
    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 101,
        'post_title' => 'Product Test Actual',
        'post_name' => 'product-test-actual',
        'post_content' => 'Actual Description',
        'post_excerpt' => 'Actual Excerpt',
        'post_status' => 'publish',
        'post_type' => 'product',
        'post_author' => 1,
    ]);
    DB::connection('wordpress')->table('postmeta')->insert([
        ['post_id' => 101, 'meta_key' => '_price', 'meta_value' => '250000.50'],
        ['post_id' => 101, 'meta_key' => '_sku', 'meta_value' => 'PROD-101'],
        ['post_id' => 101, 'meta_key' => '_manage_stock', 'meta_value' => 'yes'],
        ['post_id' => 101, 'meta_key' => '_stock', 'meta_value' => '3'],
        ['post_id' => 101, 'meta_key' => '_thumbnail_id', 'meta_value' => '500'],
        ['post_id' => 101, 'meta_key' => '_product_image_gallery', 'meta_value' => '501,502'],
    ]);

    // Attachment images in postmeta
    DB::connection('wordpress')->table('postmeta')->insert([
        ['post_id' => 500, 'meta_key' => '_wp_attached_file', 'meta_value' => '2026/06/main-thumb.png'],
        ['post_id' => 501, 'meta_key' => '_wp_attached_file', 'meta_value' => '2026/06/gallery1.png'],
        ['post_id' => 502, 'meta_key' => '_wp_attached_file', 'meta_value' => '2026/06/gallery2.png'],
    ]);

    DB::connection('wordpress')->table('term_relationships')->insert([
        ['object_id' => 101, 'term_taxonomy_id' => 21],
        ['object_id' => 101, 'term_taxonomy_id' => 11],
    ]);

    $this->artisan('woo:migrate-products')
        ->assertExitCode(0);

    // Verify Brand
    $brand = Brand::where('slug', 'brand-test-actual')->first();
    expect($brand)->not->toBeNull();
    expect($brand->name)->toBe('Brand Test Actual');

    // Verify Category
    $category = Category::where('slug', 'category-test-actual')->first();
    expect($category)->not->toBeNull();
    expect($category->name)->toBe('Category Test Actual');

    // Verify Product
    $product = Product::where('sku', 'PROD-101')->first();
    expect($product)->not->toBeNull();
    expect($product->name)->toBe('Product Test Actual');
    expect($product->base_price)->toBe('250000.50');
    expect($product->category_id)->toBe($category->id);
    expect($product->brand_id)->toBe($brand->id);
    expect($product->thumbnail)->toBe('uploads/2026/06/main-thumb.png');

    // Verify Gallery Images
    $images = ProductImage::where('product_id', $product->id)->orderBy('sort_order')->get();
    expect($images->count())->toBe(3);
    expect($images[0]->image)->toBe('uploads/2026/06/main-thumb.png');
    expect($images[0]->is_primary)->toBeTrue();
    expect($images[1]->image)->toBe('uploads/2026/06/gallery1.png');
    expect($images[1]->is_primary)->toBeFalse();
    expect($images[2]->image)->toBe('uploads/2026/06/gallery2.png');

    // Verify Stock Units
    $stockUnits = ProductStockUnit::where('product_id', $product->id)->get();
    expect($stockUnits->count())->toBe(3);
    expect($stockUnits->first()->status)->toBe('available');

    // Verify Mappings
    expect(DB::table('wordpress_migration_maps')->where('wordpress_type', 'woo_brand')->count())->toBe(1);
    expect(DB::table('wordpress_migration_maps')->where('wordpress_type', 'woo_product_category')->count())->toBe(1);
    expect(DB::table('wordpress_migration_maps')->where('wordpress_type', 'woo_product')->count())->toBe(1);

    // Repeatability: Run again, should not duplicate
    $this->artisan('woo:migrate-products')
        ->assertExitCode(0);

    expect(Brand::count())->toBe(1);
    expect(Category::count())->toBe(2); // Category Test Actual + default Uncategorized Category
    expect(Product::count())->toBe(1);
    expect(ProductImage::count())->toBe(3);
    expect(ProductStockUnit::count())->toBe(3);
});

test('woocommerce migration fresh option performs rollback first', function () {
    // Migrate first
    DB::connection('wordpress')->table('terms')->insert([
        'term_id' => 30,
        'name' => 'Brand Test Rollback',
        'slug' => 'brand-rollback',
    ]);
    DB::connection('wordpress')->table('term_taxonomy')->insert([
        'term_taxonomy_id' => 30,
        'term_id' => 30,
        'taxonomy' => 'brand',
        'parent' => 0,
    ]);

    $this->artisan('woo:migrate-products --type=brands')
        ->assertExitCode(0);

    expect(Brand::count())->toBe(1);

    // Run with fresh and confirm
    $this->artisan('woo:migrate-products --type=brands --fresh')
        ->expectsConfirmation('Are you sure you want to proceed?', 'yes')
        ->assertExitCode(0);

    expect(Brand::count())->toBe(1); // Should delete previous brand and re-create it
});
