<?php

use App\Models\Page;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\Term;
use App\Models\TermTaxonomy;
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

    // 3. Setup default language
    DB::table('languages')->insert([
        'id' => 1,
        'code' => 'id',
        'english_name' => 'Indonesian',
        'active' => 1,
        'major' => 1,
    ]);

    // 4. Setup local default admin user
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

test('wordpress migration connection check passes', function () {
    $this->artisan('wordpress:migrate --dry-run')
        ->assertExitCode(0);
});

test('wordpress migration in dry-run mode does not modify laravel tables', function () {
    // Seed WordPress Categories
    DB::connection('wordpress')->table('terms')->insert([
        'term_id' => 10,
        'name' => 'Test Category',
        'slug' => 'test-category',
    ]);
    DB::connection('wordpress')->table('term_taxonomy')->insert([
        'term_taxonomy_id' => 10,
        'term_id' => 10,
        'taxonomy' => 'category',
        'description' => 'Test description',
    ]);

    // Seed WordPress Posts
    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 100,
        'post_title' => 'Test Post Title',
        'post_name' => 'test-post-title',
        'post_content' => 'Test post content HTML.',
        'post_excerpt' => 'Test excerpt',
        'post_status' => 'publish',
        'post_type' => 'post',
        'post_author' => 1,
    ]);

    $this->artisan('wordpress:migrate --dry-run')
        ->expectsOutputToContain('[DRY-RUN] Starting WordPress migration...')
        ->expectsOutputToContain('[DRY-RUN] Migration process completed.')
        ->assertExitCode(0);

    // Verify Laravel tables remain empty
    expect(PostCategory::count())->toBe(0);
    expect(Post::count())->toBe(0);
    expect(DB::table('wordpress_migration_maps')->count())->toBe(0);
});

test('wordpress migration successfully migrates categories and tags', function () {
    // Seed WP Categories
    DB::connection('wordpress')->table('terms')->insert([
        'term_id' => 11,
        'name' => 'WordPress Category',
        'slug' => 'wp-category',
    ]);
    DB::connection('wordpress')->table('term_taxonomy')->insert([
        'term_taxonomy_id' => 11,
        'term_id' => 11,
        'taxonomy' => 'category',
        'description' => 'Category desc',
    ]);

    // Seed WP Tags
    DB::connection('wordpress')->table('terms')->insert([
        'term_id' => 12,
        'name' => 'WordPress Tag',
        'slug' => 'wp-tag',
    ]);
    DB::connection('wordpress')->table('term_taxonomy')->insert([
        'term_taxonomy_id' => 12,
        'term_id' => 12,
        'taxonomy' => 'post_tag',
        'description' => 'Tag desc',
    ]);

    $this->artisan('wordpress:migrate --type=categories')
        ->assertExitCode(0);

    $this->artisan('wordpress:migrate --type=tags')
        ->assertExitCode(0);

    // Assert category migrated
    $category = PostCategory::where('slug', 'wp-category')->first();
    expect($category)->not->toBeNull();
    expect($category->category_name)->toBe('WordPress Category');
    expect($category->description)->toBe('Category desc');

    // Assert tag migrated
    $term = Term::where('slug', 'wp-tag')->first();
    expect($term)->not->toBeNull();
    expect($term->name)->toBe('WordPress Tag');

    $termTaxonomy = TermTaxonomy::where('term_id', $term->id)->first();
    expect($termTaxonomy)->not->toBeNull();
    expect($termTaxonomy->taxonomy)->toBe('tags');
    expect($termTaxonomy->description)->toBe('Tag desc');

    // Assert maps populated
    expect(DB::table('wordpress_migration_maps')->where('wordpress_type', 'category')->exists())->toBeTrue();
    expect(DB::table('wordpress_migration_maps')->where('wordpress_type', 'tag')->exists())->toBeTrue();
});

test('wordpress migration successfully migrates posts and pages with relations', function () {
    // Seed Category & Tag
    DB::connection('wordpress')->table('terms')->insert([
        ['term_id' => 20, 'name' => 'News', 'slug' => 'news'],
        ['term_id' => 21, 'name' => 'Tutorial', 'slug' => 'tutorial'],
    ]);
    DB::connection('wordpress')->table('term_taxonomy')->insert([
        ['term_taxonomy_id' => 20, 'term_id' => 20, 'taxonomy' => 'category', 'description' => '', 'parent' => 0, 'count' => 0],
        ['term_taxonomy_id' => 21, 'term_id' => 21, 'taxonomy' => 'post_tag', 'description' => '', 'parent' => 0, 'count' => 0],
    ]);

    // Seed Media attachment
    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 30,
        'post_title' => 'Featured Thumbnail',
        'post_name' => 'featured-thumbnail',
        'post_content' => '',
        'post_excerpt' => '',
        'post_status' => 'inherit',
        'post_type' => 'attachment',
        'post_mime_type' => 'image/jpeg',
        'post_author' => 1,
    ]);
    DB::connection('wordpress')->table('postmeta')->insert([
        ['meta_id' => 1, 'post_id' => 30, 'meta_key' => '_wp_attached_file', 'meta_value' => '2026/06/flower.jpg'],
        ['meta_id' => 2, 'post_id' => 30, 'meta_key' => '_wp_attachment_image_alt', 'meta_value' => 'Alternative alt description'],
    ]);

    // Seed Post
    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 200,
        'post_title' => 'WordPress Blog Post',
        'post_name' => 'wp-blog-post',
        'post_content' => '<p>WordPress post body content HTML.</p>',
        'post_excerpt' => 'WP post excerpt',
        'post_status' => 'publish',
        'post_type' => 'post',
        'post_author' => 1,
    ]);
    DB::connection('wordpress')->table('term_relationships')->insert([
        ['object_id' => 200, 'term_taxonomy_id' => 20],
        ['object_id' => 200, 'term_taxonomy_id' => 21],
    ]);
    DB::connection('wordpress')->table('postmeta')->insert([
        ['meta_id' => 3, 'post_id' => 200, 'meta_key' => '_thumbnail_id', 'meta_value' => '30'],
        ['meta_id' => 4, 'post_id' => 200, 'meta_key' => '_yoast_wpseo_title', 'meta_value' => 'SEO Yoast Post Title'],
        ['meta_id' => 5, 'post_id' => 200, 'meta_key' => '_yoast_wpseo_metadesc', 'meta_value' => 'SEO Yoast Description'],
    ]);

    // Seed Page
    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 300,
        'post_title' => 'WordPress CMS Page',
        'post_name' => 'wp-cms-page',
        'post_content' => '<p>WordPress page body HTML.</p>',
        'post_excerpt' => 'Page excerpt detail',
        'post_status' => 'publish',
        'post_type' => 'page',
        'post_author' => 1,
    ]);
    DB::connection('wordpress')->table('postmeta')->insert([
        ['meta_id' => 6, 'post_id' => 300, 'meta_key' => '_thumbnail_id', 'meta_value' => '30'],
        ['meta_id' => 7, 'post_id' => 300, 'meta_key' => '_yoast_wpseo_title', 'meta_value' => 'SEO Yoast Page Title'],
    ]);

    // Run migration
    $this->artisan('wordpress:migrate --type=all')
        ->assertExitCode(0);

    // Verify Post Migration
    $post = Post::where('title', 'WordPress Blog Post')->first();
    expect($post)->not->toBeNull();
    expect($post->status)->toBe('publish');

    // Verify Content Decoded as block editor format
    $contentBlocks = json_decode($post->content, true);
    expect($contentBlocks)->toBeArray();
    expect($contentBlocks[0]['type'])->toBe('rich-editor');
    expect($contentBlocks[0]['data']['html'])->toBe('<p>WordPress post body content HTML.</p>');

    // Verify Post Category relationship
    $categoryUuid = $post->metas()->where('meta_key', 'post_category_id')->value('meta_value');
    expect($categoryUuid)->not->toBeNull();
    $category = PostCategory::find($categoryUuid);
    expect($category->slug)->toBe('news');

    // Verify Post Tag relationship
    expect($post->tags()->count())->toBe(1);
    expect($post->tags->first()->term->slug)->toBe('tutorial');

    // Verify Post Featured Image path
    $featuredImagePath = $post->metas()->where('meta_key', 'featured_image')->value('meta_value');
    expect($featuredImagePath)->toBe('uploads/2026/06/flower.jpg');

    // Verify Post SEO meta
    $seoTitle = $post->metas()->where('meta_key', 'seo_title')->value('meta_value');
    $seoDesc = $post->metas()->where('meta_key', 'seo_description')->value('meta_value');
    expect($seoTitle)->toBe('SEO Yoast Post Title');
    expect($seoDesc)->toBe('SEO Yoast Description');

    // Verify Page Migration
    $page = Page::where('title', 'WordPress CMS Page')->first();
    expect($page)->not->toBeNull();
    expect($page->excerpt)->toBe('Page excerpt detail');
    expect($page->featured_image)->toBe('uploads/2026/06/flower.jpg');
    expect($page->seo_title)->toBe('SEO Yoast Page Title');
});

test('wordpress migration is idempotent and does not create duplicate entries', function () {
    // Seed WP Tag
    DB::connection('wordpress')->table('terms')->insert([
        'term_id' => 50,
        'name' => 'Duplicate Test Tag',
        'slug' => 'dup-tag',
    ]);
    DB::connection('wordpress')->table('term_taxonomy')->insert([
        'term_taxonomy_id' => 50,
        'term_id' => 50,
        'taxonomy' => 'post_tag',
        'description' => 'Tag desc',
    ]);

    // Seed WP Page
    DB::connection('wordpress')->table('posts')->insert([
        'ID' => 500,
        'post_title' => 'Duplicate Test Page',
        'post_name' => 'dup-page',
        'post_content' => '<p>Page content.</p>',
        'post_excerpt' => '',
        'post_status' => 'publish',
        'post_type' => 'page',
        'post_author' => 1,
    ]);

    // Run first time
    $this->artisan('wordpress:migrate --type=all')
        ->assertExitCode(0);

    $tagsCountFirstRun = Term::where('slug', 'dup-tag')->count();
    $pagesCountFirstRun = Page::where('title', 'Duplicate Test Page')->count();

    expect($tagsCountFirstRun)->toBe(1);
    expect($pagesCountFirstRun)->toBe(1);

    // Run second time (with updates)
    DB::connection('wordpress')->table('posts')->where('ID', 500)->update(['post_title' => 'Updated Duplicate Test Page']);

    $this->artisan('wordpress:migrate --type=all')
        ->assertExitCode(0);

    $tagsCountSecondRun = Term::where('slug', 'dup-tag')->count();
    $pagesCountSecondRun = Page::where('title', 'Updated Duplicate Test Page')->count();
    $oldPageNameCount = Page::where('title', 'Duplicate Test Page')->count();

    expect($tagsCountSecondRun)->toBe(1);
    expect($pagesCountSecondRun)->toBe(1);
    expect($oldPageNameCount)->toBe(0); // Old page was successfully updated, not duplicated
});
