<?php

use App\Models\Block;
use App\Models\Dashboard\Language;
use App\Models\Dashboard\Option;
use App\Models\Page;
use App\Models\PageTranslation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function enableApiPageIndonesianLanguage(): Language
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

test('it returns only published pages in the public API', function () {
    $user = User::factory()->create();

    Page::query()->create([
        'title' => 'About Us',
        'slug' => 'about-us',
        'status' => 'publish',
        'published_at' => now()->subDay(),
        'created_by' => $user->id,
        'updated_by' => $user->id,
    ]);

    Page::query()->create([
        'title' => 'Draft Landing',
        'slug' => 'draft-landing',
        'status' => 'draft',
        'created_by' => $user->id,
        'updated_by' => $user->id,
    ]);

    $this->getJson('/api/v1/pages?per_page=10&page=1')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.slug', 'about-us')
        ->assertJsonPath('meta.total', 1);
});

test('it returns published page detail with blocks and translated slug', function () {
    $language = enableApiPageIndonesianLanguage();
    $user = User::factory()->create();
    $page = Page::query()->create([
        'title' => 'About Us',
        'slug' => 'about-us',
        'excerpt' => 'About default',
        'content' => json_encode([
            ['type' => 'heading', 'data' => ['text' => 'About Us']],
        ]),
        'status' => 'publish',
        'seo_title' => 'About SEO',
        'seo_description' => 'About description',
        'published_at' => now()->subDay(),
        'created_by' => $user->id,
        'updated_by' => $user->id,
    ]);

    PageTranslation::query()->create([
        'page_id' => $page->id,
        'language_id' => $language->id,
        'title' => 'Tentang Kami',
        'slug' => 'tentang-kami',
        'excerpt' => 'Tentang default',
        'content' => json_encode([
            ['type' => 'heading', 'data' => ['text' => 'Tentang Kami']],
        ]),
        'status' => 'publish',
        'seo_title' => 'Tentang SEO',
        'seo_description' => 'Tentang description',
        'published_at' => now()->subDay(),
    ]);

    Block::query()->create([
        'page_id' => $page->id,
        'type' => 'heading',
        'props' => ['text' => 'About Us', 'level' => 'h1'],
        'styles' => [],
        'order' => 0,
    ]);

    $this->getJson('/api/v1/pages/tentang-kami?locale=id')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.title', 'Tentang Kami')
        ->assertJsonPath('data.slug', 'tentang-kami')
        ->assertJsonPath('data.seo.title', 'Tentang SEO')
        ->assertJsonPath('data.blocks.0.type', 'heading')
        ->assertJsonPath('data.blocks.0.data.text', 'About Us')
        ->assertJsonPath('data.language.code', 'id');
});

test('it returns not found for draft pages', function () {
    Page::query()->create([
        'title' => 'Draft Page',
        'slug' => 'draft-page',
        'status' => 'draft',
    ]);

    $this->getJson('/api/v1/pages/draft-page')
        ->assertNotFound()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Page not found');
});
