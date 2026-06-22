<?php

use App\Models\Shop\Category;
use App\Models\Shop\Product;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    // 1. Mock the services.idcloudhost.url config
    config(['services.idcloudhost.url' => 'https://is3.cloudhost.id/arumiflorist-assets']);

    // 2. Set up the wordpress connection dynamically to use in-memory SQLite database
    config([
        'database.connections.wordpress' => [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => 'wp_',
        ],
    ]);

    DB::purge('wordpress');

    // 3. Create the tables in the wordpress connection
    Schema::connection('wordpress')->create('posts', function ($table) {
        $table->id('ID');
        $table->string('post_title');
        $table->string('post_name');
        $table->string('post_type');
        $table->string('post_status');
        $table->string('post_mime_type')->nullable();
    });

    Schema::connection('wordpress')->create('postmeta', function ($table) {
        $table->id('meta_id');
        $table->unsignedBigInteger('post_id');
        $table->string('meta_key');
        $table->longText('meta_value')->nullable();
    });

    // 4. Create category in products database since category_id is non-nullable
    $this->category = Category::create([
        'name' => 'Uncategorized',
        'slug' => 'uncategorized',
        'is_publish' => true,
    ]);
});

afterEach(function () {
    Schema::connection('wordpress')->dropIfExists('posts');
    Schema::connection('wordpress')->dropIfExists('postmeta');
});

test('it fails if IDCH_URL is missing', function () {
    config(['services.idcloudhost.url' => '']);

    $status = Artisan::call('wp:migrate-product-featured-images');
    expect($status)->toBe(1);
    expect(Artisan::output())
        ->toContain('IDCloudHost base URL (IDCH_URL) is not configured');
});

test('it fails if wordpress tables do not exist', function () {
    Schema::connection('wordpress')->dropIfExists('posts');

    $status = Artisan::call('wp:migrate-product-featured-images', ['--wp-prefix' => 'wp_']);
    expect($status)->toBe(1);
    expect(Artisan::output())
        ->toContain("WordPress tables ('posts' or 'postmeta') do not exist");
});

test('it migrates product featured images matching by wp_id', function () {
    // Create a local product to match
    $laravelProduct = Product::create([
        'category_id' => $this->category->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'sku' => 'TEST-SKU',
        'description' => 'Description',
        'base_price' => 10000,
        'wp_id' => 100,
    ]);

    // Insert WordPress WooCommerce product and attachment metadata
    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 100,
        'post_title' => 'Test Product',
        'post_name' => 'test-product',
        'post_type' => 'product',
        'post_status' => 'publish',
    ]);

    DB::connection('wordpress')->table('postmeta')->insert([
        [
            'post_id' => 100,
            'meta_key' => '_thumbnail_id',
            'meta_value' => '200',
        ],
        [
            'post_id' => 200,
            'meta_key' => '_wp_attached_file',
            'meta_value' => '2026/06/product.webp',
        ],
    ]);

    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 200,
        'post_title' => 'Attachment Product Image',
        'post_name' => 'attachment-product-image',
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'post_mime_type' => 'image/webp',
    ]);

    // Run command
    $status = Artisan::call('wp:migrate-product-featured-images', [
        '--match' => 'wp_id',
        '--s3-prefix' => 'media',
        '--wp-prefix' => 'wp_',
    ]);

    expect($status)->toBe(0);
    $output = Artisan::output();
    expect($output)
        ->toContain('Found 1 WordPress WooCommerce products with featured images')
        ->toContain('Updated')
        ->toContain('Total Found in WP');

    $laravelProduct->refresh();
    expect($laravelProduct->thumbnail)->toBe('media/2026/06/product.webp')
        ->and($laravelProduct->thumbnail_url)->toBe('https://is3.cloudhost.id/arumiflorist-assets/media/2026/06/product.webp')
        ->and($laravelProduct->thumbnail_mime_type)->toBe('image/webp');
});

test('it maps using wordpress_migration_maps if wp_id column is not matched directly', function () {
    $laravelProduct = Product::create([
        'category_id' => $this->category->id,
        'name' => 'Test Product 2',
        'slug' => 'test-product-2',
        'sku' => 'TEST-SKU-2',
        'base_price' => 20000,
    ]);

    // Insert into wordpress_migration_maps (using type woo_product)
    DB::table('wordpress_migration_maps')->insert([
        'wordpress_id' => 150,
        'wordpress_type' => 'woo_product',
        'laravel_table' => 'products',
        'laravel_id' => $laravelProduct->id,
        'migrated_at' => now(),
    ]);

    // Insert WordPress WooCommerce product and attachment metadata
    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 150,
        'post_title' => 'Test Product 2',
        'post_name' => 'test-product-2',
        'post_type' => 'product',
        'post_status' => 'publish',
    ]);

    DB::connection('wordpress')->table('postmeta')->insert([
        [
            'post_id' => 150,
            'meta_key' => '_thumbnail_id',
            'meta_value' => '250',
        ],
        [
            'post_id' => 250,
            'meta_key' => '_wp_attached_file',
            'meta_value' => '2026/06/product2.webp',
        ],
    ]);

    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 250,
        'post_title' => 'Attachment Product Image 2',
        'post_name' => 'attachment-product-image-2',
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'post_mime_type' => 'image/webp',
    ]);

    $status = Artisan::call('wp:migrate-product-featured-images', [
        '--match' => 'wp_id',
        '--wp-prefix' => 'wp_',
    ]);
    expect($status)->toBe(0);
    expect(Artisan::output())->toContain('Updated');

    $laravelProduct->refresh();
    expect($laravelProduct->thumbnail)->toBe('media/2026/06/product2.webp')
        ->and($laravelProduct->wp_id)->toBe(150);
});

test('it matches by slug', function () {
    $laravelProduct = Product::create([
        'category_id' => $this->category->id,
        'name' => 'Slug Match Product',
        'slug' => 'slug-match-product',
        'sku' => 'TEST-SKU-3',
        'base_price' => 30000,
    ]);

    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 300,
        'post_title' => 'Slug Match Product',
        'post_name' => 'slug-match-product',
        'post_type' => 'product',
        'post_status' => 'publish',
    ]);

    DB::connection('wordpress')->table('postmeta')->insert([
        [
            'post_id' => 300,
            'meta_key' => '_thumbnail_id',
            'meta_value' => '400',
        ],
        [
            'post_id' => 400,
            'meta_key' => '_wp_attached_file',
            'meta_value' => '2026/06/slug-match-prod.webp',
        ],
    ]);

    $status = Artisan::call('wp:migrate-product-featured-images', [
        '--match' => 'slug',
        '--wp-prefix' => 'wp_',
    ]);
    expect($status)->toBe(0);
    expect(Artisan::output())->toContain('Updated');

    $laravelProduct->refresh();
    expect($laravelProduct->thumbnail)->toBe('media/2026/06/slug-match-prod.webp');
});

test('it supports dry-run', function () {
    $laravelProduct = Product::create([
        'category_id' => $this->category->id,
        'name' => 'Dry Run Product',
        'slug' => 'dry-run-product',
        'sku' => 'TEST-SKU-4',
        'base_price' => 40000,
    ]);

    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 500,
        'post_title' => 'Dry Run Product',
        'post_name' => 'dry-run-product',
        'post_type' => 'product',
        'post_status' => 'publish',
    ]);

    DB::connection('wordpress')->table('postmeta')->insert([
        [
            'post_id' => 500,
            'meta_key' => '_thumbnail_id',
            'meta_value' => '600',
        ],
        [
            'post_id' => 600,
            'meta_key' => '_wp_attached_file',
            'meta_value' => '2026/06/dryrun-prod.webp',
        ],
    ]);

    $status = Artisan::call('wp:migrate-product-featured-images', [
        '--match' => 'slug',
        '--dry-run' => true,
        '--wp-prefix' => 'wp_',
    ]);
    expect($status)->toBe(0);
    expect(Artisan::output())
        ->toContain('[DRY-RUN] Would update Product')
        ->toContain('Would Update');

    $laravelProduct->refresh();
    expect($laravelProduct->thumbnail)->toBeNull();
});

test('it is idempotent', function () {
    $laravelProduct = Product::create([
        'category_id' => $this->category->id,
        'name' => 'Idempotent Product',
        'slug' => 'idempotent-product',
        'sku' => 'TEST-SKU-5',
        'base_price' => 50000,
        'wp_id' => 700,
        'thumbnail' => 'media/2026/06/idem-prod.webp',
        'thumbnail_url' => 'https://is3.cloudhost.id/arumiflorist-assets/media/2026/06/idem-prod.webp',
    ]);

    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 700,
        'post_title' => 'Idempotent Product',
        'post_name' => 'idempotent-product',
        'post_type' => 'product',
        'post_status' => 'publish',
    ]);

    DB::connection('wordpress')->table('postmeta')->insert([
        [
            'post_id' => 700,
            'meta_key' => '_thumbnail_id',
            'meta_value' => '800',
        ],
        [
            'post_id' => 800,
            'meta_key' => '_wp_attached_file',
            'meta_value' => '2026/06/idem-prod.webp',
        ],
    ]);

    $status = Artisan::call('wp:migrate-product-featured-images', [
        '--match' => 'wp_id',
        '--wp-prefix' => 'wp_',
    ]);
    expect($status)->toBe(0);
    expect(Artisan::output())->toContain('Skipped (Up to date/No media)');
});
