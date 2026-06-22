<?php

use App\Models\Post;
use App\Models\User;
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
});

afterEach(function () {
    Schema::connection('wordpress')->dropIfExists('posts');
    Schema::connection('wordpress')->dropIfExists('postmeta');
});

test('it fails if IDCH_URL is missing', function () {
    config(['services.idcloudhost.url' => '']);

    $status = Artisan::call('wp:migrate-featured-images');
    expect($status)->toBe(1);
    expect(Artisan::output())
        ->toContain('IDCloudHost base URL (IDCH_URL) is not configured');
});

test('it fails if wordpress tables do not exist', function () {
    Schema::connection('wordpress')->dropIfExists('posts');

    $status = Artisan::call('wp:migrate-featured-images', ['--wp-prefix' => 'wp_']);
    expect($status)->toBe(1);
    expect(Artisan::output())
        ->toContain("WordPress tables ('posts' or 'postmeta') do not exist");
});

test('it migrates featured images matching by wp_id', function () {
    // Create a local post to match
    $user = User::factory()->create();
    $laravelPost = Post::create([
        'user_id' => $user->id,
        'title' => 'Test Post',
        'slug' => 'test-post',
        'content' => 'Content',
        'type' => 'post',
        'status' => 'publish',
        'wp_id' => 10,
    ]);

    // Insert WordPress post and attachment metadata
    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 10,
        'post_title' => 'Test Post',
        'post_name' => 'test-post',
        'post_type' => 'post',
        'post_status' => 'publish',
    ]);

    DB::connection('wordpress')->table('postmeta')->insert([
        [
            'post_id' => 10,
            'meta_key' => '_thumbnail_id',
            'meta_value' => '20',
        ],
        [
            'post_id' => 20,
            'meta_key' => '_wp_attached_file',
            'meta_value' => '2026/06/image.webp',
        ],
    ]);

    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 20,
        'post_title' => 'Attachment Image',
        'post_name' => 'attachment-image',
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'post_mime_type' => 'image/webp',
    ]);

    // Run command
    $status = Artisan::call('wp:migrate-featured-images', [
        '--match' => 'wp_id',
        '--s3-prefix' => 'media',
        '--wp-prefix' => 'wp_',
    ]);

    expect($status)->toBe(0);
    $output = Artisan::output();
    expect($output)
        ->toContain('Found 1 WordPress posts with featured images')
        ->toContain('Updated')
        ->toContain('Total Found in WP');

    $laravelPost->refresh();
    expect($laravelPost->featured_image)->toBe('media/2026/06/image.webp')
        ->and($laravelPost->featured_image_url)->toBe('https://is3.cloudhost.id/arumiflorist-assets/media/2026/06/image.webp')
        ->and($laravelPost->featured_image_mime_type)->toBe('image/webp');
});

test('it maps using wordpress_migration_maps if wp_id column is not matched directly', function () {
    $user = User::factory()->create();
    $laravelPost = Post::create([
        'user_id' => $user->id,
        'title' => 'Test Post 2',
        'slug' => 'test-post-2',
        'content' => 'Content 2',
        'type' => 'post',
        'status' => 'publish',
    ]);

    // Insert into wordpress_migration_maps
    DB::table('wordpress_migration_maps')->insert([
        'wordpress_id' => 15,
        'wordpress_type' => 'post',
        'laravel_table' => 'posts',
        'laravel_id' => $laravelPost->id,
        'migrated_at' => now(),
    ]);

    // Insert WordPress post and attachment metadata
    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 15,
        'post_title' => 'Test Post 2',
        'post_name' => 'test-post-2',
        'post_type' => 'post',
        'post_status' => 'publish',
    ]);

    DB::connection('wordpress')->table('postmeta')->insert([
        [
            'post_id' => 15,
            'meta_key' => '_thumbnail_id',
            'meta_value' => '25',
        ],
        [
            'post_id' => 25,
            'meta_key' => '_wp_attached_file',
            'meta_value' => '2026/06/image2.webp',
        ],
    ]);

    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 25,
        'post_title' => 'Attachment Image 2',
        'post_name' => 'attachment-image-2',
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'post_mime_type' => 'image/webp',
    ]);

    $status = Artisan::call('wp:migrate-featured-images', [
        '--match' => 'wp_id',
        '--wp-prefix' => 'wp_',
    ]);
    expect($status)->toBe(0);
    expect(Artisan::output())->toContain('Updated');

    $laravelPost->refresh();
    expect($laravelPost->featured_image)->toBe('media/2026/06/image2.webp')
        ->and($laravelPost->wp_id)->toBe(15);
});

test('it matches by slug', function () {
    $user = User::factory()->create();
    $laravelPost = Post::create([
        'user_id' => $user->id,
        'title' => 'Slug Match Post',
        'slug' => 'slug-match-post',
        'content' => 'Content',
        'type' => 'post',
        'status' => 'publish',
    ]);

    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 30,
        'post_title' => 'Slug Match Post',
        'post_name' => 'slug-match-post',
        'post_type' => 'post',
        'post_status' => 'publish',
    ]);

    DB::connection('wordpress')->table('postmeta')->insert([
        [
            'post_id' => 30,
            'meta_key' => '_thumbnail_id',
            'meta_value' => '40',
        ],
        [
            'post_id' => 40,
            'meta_key' => '_wp_attached_file',
            'meta_value' => '2026/06/slug-match.webp',
        ],
    ]);

    $status = Artisan::call('wp:migrate-featured-images', [
        '--match' => 'slug',
        '--wp-prefix' => 'wp_',
    ]);
    expect($status)->toBe(0);
    expect(Artisan::output())->toContain('Updated');

    $laravelPost->refresh();
    expect($laravelPost->featured_image)->toBe('media/2026/06/slug-match.webp');
});

test('it supports dry-run', function () {
    $user = User::factory()->create();
    $laravelPost = Post::create([
        'user_id' => $user->id,
        'title' => 'Dry Run Post',
        'slug' => 'dry-run-post',
        'content' => 'Content',
        'type' => 'post',
        'status' => 'publish',
    ]);

    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 50,
        'post_title' => 'Dry Run Post',
        'post_name' => 'dry-run-post',
        'post_type' => 'post',
        'post_status' => 'publish',
    ]);

    DB::connection('wordpress')->table('postmeta')->insert([
        [
            'post_id' => 50,
            'meta_key' => '_thumbnail_id',
            'meta_value' => '60',
        ],
        [
            'post_id' => 60,
            'meta_key' => '_wp_attached_file',
            'meta_value' => '2026/06/dryrun.webp',
        ],
    ]);

    $status = Artisan::call('wp:migrate-featured-images', [
        '--match' => 'slug',
        '--dry-run' => true,
        '--wp-prefix' => 'wp_',
    ]);
    expect($status)->toBe(0);
    expect(Artisan::output())
        ->toContain('[DRY-RUN] Would update Post')
        ->toContain('Would Update');

    $laravelPost->refresh();
    expect($laravelPost->featured_image)->toBeNull();
});

test('it is idempotent', function () {
    $user = User::factory()->create();
    $laravelPost = Post::create([
        'user_id' => $user->id,
        'title' => 'Idempotent Post',
        'slug' => 'idempotent-post',
        'content' => 'Content',
        'type' => 'post',
        'status' => 'publish',
        'wp_id' => 70,
        'featured_image' => 'media/2026/06/idem.webp',
        'featured_image_url' => 'https://is3.cloudhost.id/arumiflorist-assets/media/2026/06/idem.webp',
    ]);

    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 70,
        'post_title' => 'Idempotent Post',
        'post_name' => 'idempotent-post',
        'post_type' => 'post',
        'post_status' => 'publish',
    ]);

    DB::connection('wordpress')->table('postmeta')->insert([
        [
            'post_id' => 70,
            'meta_key' => '_thumbnail_id',
            'meta_value' => '80',
        ],
        [
            'post_id' => 80,
            'meta_key' => '_wp_attached_file',
            'meta_value' => '2026/06/idem.webp',
        ],
    ]);

    $status = Artisan::call('wp:migrate-featured-images', [
        '--match' => 'wp_id',
        '--wp-prefix' => 'wp_',
    ]);
    expect($status)->toBe(0);
    expect(Artisan::output())->toContain('Skipped (Up to date/No media)');
});
