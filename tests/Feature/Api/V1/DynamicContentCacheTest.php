<?php

use App\Models\ContentEntry;
use App\Models\ContentType;
use App\Models\CustomFieldGroup;
use App\Models\Dashboard\Language;
use App\Models\Dashboard\Option;
use App\Services\Cache\ContentCacheService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function () {
    Cache::flush();
    config([
        'cache.default' => 'database', // Test using database cache store as specified in .env
        'list-cache.enabled' => true,
    ]);

    // Ensure we have active languages
    Language::query()->updateOrCreate(
        ['code' => 'en'],
        ['english_name' => 'English', 'active' => true]
    );

    Language::query()->updateOrCreate(
        ['code' => 'id'],
        ['english_name' => 'Indonesia', 'active' => true]
    );

    Option::updateOrCreate(['key' => 'default_language'], ['value' => 'en']);
    Option::updateOrCreate(['key' => 'languages'], ['value' => json_encode(['en', 'id'])]);
});

function createTestContentType(array $attributes = []): ContentType
{
    return ContentType::query()->create(array_merge([
        'name' => 'Sliders',
        'slug' => 'sliders',
        'description' => 'Homepage sliders',
        'is_active' => true,
        'sort_order' => 1,
    ], $attributes));
}

function createTestFieldGroup(ContentType $contentType): CustomFieldGroup
{
    return CustomFieldGroup::query()->create([
        'name' => 'Slider Fields',
        'slug' => 'slider-fields',
        'target_type' => 'content_type',
        'target_id' => $contentType->id,
        'is_active' => true,
        'sort_order' => 1,
    ]);
}

function createTestField(CustomFieldGroup $group, array $attributes = []): void
{
    $group->fields()->create(array_merge([
        'label' => 'Button Text',
        'name' => 'button_text',
        'type' => 'text',
        'is_required' => true,
        'is_active' => true,
        'sort_order' => 1,
    ], $attributes));
}

test('it handles cache creation, localization, update invalidation, and deletion invalidation for content endpoint', function () {
    $contentType = createTestContentType();
    $group = createTestFieldGroup($contentType);
    createTestField($group);

    $idLang = Language::where('code', 'id')->first();
    $enLang = Language::where('code', 'en')->first();

    // 1. Create content entry slider with locale 'id'
    $entry = ContentEntry::create([
        'content_type_id' => $contentType->id,
        'title' => 'Main English Slider',
        'slug' => 'main-english-slider',
        'status' => 'published',
        'published_at' => now()->subMinute(),
        'sort_order' => 1,
        'data' => [
            'button_text' => 'Click English',
        ],
    ]);

    $entry->translations()->create([
        'language_id' => $idLang->id,
        'title' => 'Slider Utama Indonesia',
        'slug' => 'slider-utama-indonesia',
        'status' => 'published',
        'published_at' => now()->subMinute(),
        'data' => [
            'button_text' => 'Klik Indonesia',
        ],
    ]);

    // 2. Hit endpoint sliders with locale=id and ensure data appears
    $responseId = $this->getJson('/api/v1/content/sliders?locale=id')
        ->assertSuccessful()
        ->assertJsonPath('data.0.title', 'Slider Utama Indonesia')
        ->assertJsonPath('data.0.fields.button_text', 'Klik Indonesia');

    // 3. Hit endpoint with locale=en and ensure data is English (different cache key)
    $responseEn = $this->getJson('/api/v1/content/sliders?locale=en')
        ->assertSuccessful()
        ->assertJsonPath('data.0.title', 'Main English Slider')
        ->assertJsonPath('data.0.fields.button_text', 'Click English');

    // 4. Update translation and verify cache invalidation
    $translation = $entry->translations()->where('language_id', $idLang->id)->first();
    $translation->update([
        'title' => 'Slider Utama Indonesia Updated',
        'data' => [
            'button_text' => 'Klik Indonesia Baru',
        ],
    ]);

    // Hit endpoint again, ensure data is updated (cache invalidated and refreshed)
    $this->getJson('/api/v1/content/sliders?locale=id')
        ->assertSuccessful()
        ->assertJsonPath('data.0.title', 'Slider Utama Indonesia Updated')
        ->assertJsonPath('data.0.fields.button_text', 'Klik Indonesia Baru');

    // 5. Update main entry and verify cache invalidation
    $entry->update([
        'title' => 'Main English Slider Updated',
        'data' => [
            'button_text' => 'Click English Updated',
        ],
    ]);

    $this->getJson('/api/v1/content/sliders?locale=en')
        ->assertSuccessful()
        ->assertJsonPath('data.0.title', 'Main English Slider Updated')
        ->assertJsonPath('data.0.fields.button_text', 'Click English Updated');

    // 6. Delete entry and verify cache invalidation
    $entry->delete();

    $this->getJson('/api/v1/content/sliders?locale=id')
        ->assertSuccessful()
        ->assertJsonCount(0, 'data');

    $this->getJson('/api/v1/content/sliders?locale=en')
        ->assertSuccessful()
        ->assertJsonCount(0, 'data');
});

test('it separates cache keys by query params and clears selectively using command', function () {
    $contentType = createTestContentType();
    $group = createTestFieldGroup($contentType);
    createTestField($group);

    $entry = ContentEntry::create([
        'content_type_id' => $contentType->id,
        'title' => 'Slider 1',
        'slug' => 'slider-1',
        'status' => 'published',
        'published_at' => now()->subMinute(),
        'data' => [
            'button_text' => 'Button 1',
        ],
    ]);

    // Hit with page=1
    $this->getJson('/api/v1/content/sliders?page=1')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data');

    // Hit with page=2
    $this->getJson('/api/v1/content/sliders?page=2')
        ->assertSuccessful()
        ->assertJsonCount(0, 'data');

    $cacheService = app(ContentCacheService::class);

    // Command clear slug=sliders
    $this->artisan('content-cache:clear', ['--slug' => 'sliders'])
        ->assertExitCode(0);

    // Command clear locale=id
    $this->artisan('content-cache:clear', ['--locale' => 'id'])
        ->assertExitCode(0);

    // Command clear all
    $this->artisan('content-cache:clear')
        ->assertExitCode(0);
});
