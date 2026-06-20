<?php

use App\Models\Dashboard\Language;
use App\Models\Dashboard\Option;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\PostTranslation;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    collect([
        'term_relationships',
        'post_translations',
        'post_categories',
        'post_meta',
        'term_taxonomy',
        'terms',
        'posts',
        'options',
        'languages',
    ])->each(fn (string $table) => Schema::dropIfExists($table));

    Schema::create('languages', function (Blueprint $table): void {
        $table->id();
        $table->string('code', 7)->unique();
        $table->string('english_name')->nullable();
        $table->tinyInteger('major')->nullable()->default(0);
        $table->tinyInteger('active')->nullable();
        $table->string('default_locale', 35)->nullable();
        $table->string('tag', 35)->nullable();
        $table->tinyInteger('encode_url')->nullable()->default(0);
        $table->string('country')->nullable();
        $table->timestamps();
    });

    Schema::create('options', function (Blueprint $table): void {
        $table->id();
        $table->string('key')->unique();
        $table->longText('value')->nullable();
        $table->string('type')->nullable();
        $table->boolean('autoload')->default(false);
        $table->timestamps();
    });

    Schema::create('posts', function (Blueprint $table): void {
        $table->id();
        $table->unsignedBigInteger('user_id');
        $table->string('title');
        $table->string('slug')->unique();
        $table->text('excerpt')->nullable();
        $table->longText('content')->nullable();
        $table->string('type')->default('post');
        $table->string('status')->default('publish');
        $table->unsignedBigInteger('parent_id')->nullable();
        $table->string('mime_type')->nullable();
        $table->boolean('comment_status')->default(true);
        $table->timestamp('published_at')->nullable();
        $table->timestamps();
    });

    Schema::create('post_meta', function (Blueprint $table): void {
        $table->id();
        $table->unsignedBigInteger('post_id');
        $table->string('meta_key');
        $table->longText('meta_value')->nullable();
        $table->timestamps();
    });

    Schema::create('terms', function (Blueprint $table): void {
        $table->id();
        $table->string('name');
        $table->string('slug')->unique();
        $table->timestamps();
    });

    Schema::create('term_taxonomy', function (Blueprint $table): void {
        $table->id();
        $table->unsignedBigInteger('term_id');
        $table->string('taxonomy');
        $table->text('description')->nullable();
        $table->unsignedBigInteger('parent_id')->nullable();
        $table->unsignedInteger('count')->default(0);
        $table->timestamps();
    });

    Schema::create('term_relationships', function (Blueprint $table): void {
        $table->unsignedBigInteger('post_id');
        $table->unsignedBigInteger('term_taxonomy_id');
        $table->primary(['post_id', 'term_taxonomy_id']);
        $table->timestamps();
    });

    Schema::create('post_categories', function (Blueprint $table): void {
        $table->uuid('id')->primary();
        $table->uuid('user_id')->nullable();
        $table->string('category_name', 191)->nullable();
        $table->string('slug', 191)->nullable();
        $table->longText('description')->nullable();
        $table->uuid('parent_id')->nullable();
        $table->string('featured_image')->nullable();
        $table->timestamps();
    });

    Schema::create('post_translations', function (Blueprint $table): void {
        $table->id();
        $table->unsignedBigInteger('post_id');
        $table->unsignedBigInteger('language_id');
        $table->string('title');
        $table->string('slug');
        $table->text('excerpt')->nullable();
        $table->longText('content')->nullable();
        $table->string('status')->default('draft');
        $table->timestamp('published_at')->nullable();
        $table->timestamps();
    });
});

function enableApiPostIndonesianLanguage(): Language
{
    $language = Language::query()->create([
        'code' => 'id',
        'english_name' => 'Indonesian',
        'active' => 1,
        'default_locale' => 'id_ID',
        'tag' => 'id-ID',
    ]);

    Option::query()->updateOrCreate(
        ['key' => 'languages'],
        ['value' => json_encode(['id']), 'type' => 'json', 'autoload' => true]
    );
    Option::query()->updateOrCreate(
        ['key' => 'default_language'],
        ['value' => 'id', 'type' => 'string', 'autoload' => true]
    );

    return $language;
}

function createApiPostForCategory(string $title, string $slug, PostCategory $category, Language $language): Post
{
    $post = Post::query()->create([
        'user_id' => 1,
        'title' => $title,
        'slug' => $slug,
        'content' => '<p>'.$title.'</p>',
        'type' => 'post',
        'status' => 'publish',
        'published_at' => now()->subDay(),
    ]);

    $post->metas()->create([
        'meta_key' => 'post_category_id',
        'meta_value' => $category->id,
    ]);

    PostTranslation::query()->create([
        'post_id' => $post->id,
        'language_id' => $language->id,
        'title' => $title,
        'slug' => $slug,
        'content' => '<p>'.$title.'</p>',
        'status' => 'publish',
        'published_at' => now()->subDay(),
    ]);

    return $post;
}

test('it returns published posts for the news category alias when no news category exists', function () {
    $language = enableApiPostIndonesianLanguage();
    $category = PostCategory::query()->create([
        'category_name' => 'Gadget',
        'slug' => 'gadget',
    ]);

    createApiPostForCategory('Tips Gadget', 'tips-gadget', $category, $language);

    $this->getJson('/api/v1/posts?category=news&language=id&per_page=10&page=1&sort=latest')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.slug', 'tips-gadget')
        ->assertJsonPath('meta.total', 1);
});

test('it filters by news category when the category exists', function () {
    $language = enableApiPostIndonesianLanguage();
    $newsCategory = PostCategory::query()->create([
        'category_name' => 'News',
        'slug' => 'news',
    ]);
    $gadgetCategory = PostCategory::query()->create([
        'category_name' => 'Gadget',
        'slug' => 'gadget',
    ]);

    createApiPostForCategory('Market News', 'market-news', $newsCategory, $language);
    createApiPostForCategory('Tips Gadget', 'tips-gadget', $gadgetCategory, $language);

    $this->getJson('/api/v1/posts?category=news&language=id&per_page=10&page=1&sort=latest')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.slug', 'market-news')
        ->assertJsonPath('meta.total', 1);
});

test('it prefers translated excerpt when available', function () {
    $language = enableApiPostIndonesianLanguage();

    $post = Post::query()->create([
        'user_id' => 1,
        'title' => 'Market Update',
        'slug' => 'market-update',
        'excerpt' => 'Default excerpt',
        'content' => '<p>Default content</p>',
        'type' => 'post',
        'status' => 'publish',
        'published_at' => now()->subDay(),
    ]);

    PostTranslation::query()->create([
        'post_id' => $post->id,
        'language_id' => $language->id,
        'title' => 'Market Update ID',
        'slug' => 'market-update-id',
        'excerpt' => 'Excerpt terjemahan',
        'content' => '<p>Konten terjemahan</p>',
        'status' => 'publish',
        'published_at' => now()->subDay(),
    ]);

    $this->getJson('/api/v1/posts?language=id&per_page=10&page=1&sort=latest')
        ->assertSuccessful()
        ->assertJsonPath('data.0.slug', 'market-update-id')
        ->assertJsonPath('data.0.excerpt', 'Excerpt terjemahan');
});
