<?php

use App\Models\ContentEntry;
use App\Models\ContentType;
use App\Models\CustomFieldGroup;
use App\Models\Dashboard\Language;
use App\Models\Dashboard\Media;
use App\Models\Dashboard\Option;
use App\Services\Cache\ListCacheService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function createApiDynamicContentType(array $attributes = []): ContentType
{
    return ContentType::query()->create(array_merge([
        'name' => 'Testimonials',
        'slug' => 'testimonials',
        'description' => 'Customer testimonials',
        'icon' => 'message-square-quote',
        'is_active' => true,
        'sort_order' => 1,
    ], $attributes));
}

function createApiDynamicFieldGroup(ContentType $contentType, array $attributes = []): CustomFieldGroup
{
    return CustomFieldGroup::query()->create(array_merge([
        'name' => 'Testimonial Fields',
        'slug' => 'testimonial-fields',
        'target_type' => 'content_type',
        'target_id' => $contentType->id,
        'is_active' => true,
        'sort_order' => 1,
    ], $attributes));
}

function createApiDynamicField(CustomFieldGroup $group, array $attributes = []): void
{
    $group->fields()->create(array_merge([
        'label' => 'Customer Name',
        'name' => 'customer_name',
        'type' => 'text',
        'is_required' => true,
        'is_active' => true,
        'sort_order' => 1,
    ], $attributes));
}

test('it returns only active content types with active field groups and fields', function () {
    $activeType = createApiDynamicContentType();
    $inactiveType = createApiDynamicContentType([
        'name' => 'Partners',
        'slug' => 'partners',
        'is_active' => false,
    ]);

    $activeGroup = createApiDynamicFieldGroup($activeType);
    createApiDynamicField($activeGroup);
    createApiDynamicField($activeGroup, [
        'label' => 'Hidden Field',
        'name' => 'hidden_field',
        'is_active' => false,
        'sort_order' => 2,
    ]);

    createApiDynamicFieldGroup($activeType, [
        'name' => 'Inactive Group',
        'slug' => 'inactive-group',
        'is_active' => false,
        'sort_order' => 2,
    ]);

    createApiDynamicFieldGroup($inactiveType, [
        'name' => 'Partner Fields',
        'slug' => 'partner-fields',
    ]);

    $this->getJson('/api/v1/content-types')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.slug', 'testimonials')
        ->assertJsonCount(1, 'data.0.field_groups')
        ->assertJsonPath('data.0.field_groups.0.slug', 'testimonial-fields')
        ->assertJsonCount(1, 'data.0.field_groups.0.fields')
        ->assertJsonPath('data.0.field_groups.0.fields.0.name', 'customer_name');
});

test('it returns published dynamic content entries with mapped media payloads', function () {
    Storage::fake('public');
    Storage::disk('public')->put('media/testimonials/budi.webp', 'image');

    $contentType = createApiDynamicContentType();
    $group = createApiDynamicFieldGroup($contentType);

    createApiDynamicField($group, [
        'label' => 'Customer Name',
        'name' => 'customer_name',
        'type' => 'text',
        'sort_order' => 1,
    ]);
    createApiDynamicField($group, [
        'label' => 'Customer Photo',
        'name' => 'customer_photo',
        'type' => 'image',
        'is_required' => false,
        'sort_order' => 2,
    ]);
    createApiDynamicField($group, [
        'label' => 'Is Featured',
        'name' => 'is_featured',
        'type' => 'true_false',
        'is_required' => false,
        'sort_order' => 3,
    ]);

    Media::query()->create([
        'name' => 'Budi Photo',
        'file_name' => 'budi.webp',
        'mime_type' => 'image/webp',
        'path' => 'media/testimonials/budi.webp',
        'disk' => 'public',
        'alt' => 'Budi Santoso',
    ]);

    ContentEntry::query()->create([
        'content_type_id' => $contentType->id,
        'title' => 'Testimoni dari Budi',
        'slug' => 'testimoni-dari-budi',
        'excerpt' => 'Pelanggan setia',
        'status' => 'published',
        'published_at' => now()->subMinute(),
        'sort_order' => 1,
        'data' => [
            'customer_name' => 'Budi Santoso',
            'customer_photo' => 'media/testimonials/budi.webp',
            'is_featured' => true,
        ],
    ]);

    ContentEntry::query()->create([
        'content_type_id' => $contentType->id,
        'title' => 'Draft Testimoni',
        'slug' => 'draft-testimoni',
        'status' => 'draft',
        'data' => [
            'customer_name' => 'Draft User',
            'is_featured' => true,
        ],
    ]);

    ContentEntry::query()->create([
        'content_type_id' => $contentType->id,
        'title' => 'Future Testimoni',
        'slug' => 'future-testimoni',
        'status' => 'published',
        'published_at' => now()->addDay(),
        'data' => [
            'customer_name' => 'Future User',
            'is_featured' => true,
        ],
    ]);

    $this->getJson('/api/v1/content/testimonials?is_featured=true&search=Budi')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.slug', 'testimoni-dari-budi')
        ->assertJsonPath('data.0.content_type.slug', 'testimonials')
        ->assertJsonPath('data.0.fields.customer_name', 'Budi Santoso')
        ->assertJsonPath('data.0.fields.customer_photo.alt_text', 'Budi Santoso')
        ->assertJsonPath('data.0.fields.customer_photo.url', fn (string $url) => str_contains($url, '/storage/media/testimonials/budi.webp'))
        ->assertJsonPath('meta.total', 1);

    $this->getJson('/api/v1/content/testimonials/testimoni-dari-budi')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.slug', 'testimoni-dari-budi')
        ->assertJsonPath('data.fields.customer_name', 'Budi Santoso')
        ->assertJsonPath('data.fields.customer_photo.filename', 'budi.webp');
});

test('it returns not found for missing content types or unpublished entries', function () {
    $contentType = createApiDynamicContentType();
    $group = createApiDynamicFieldGroup($contentType);

    createApiDynamicField($group, [
        'label' => 'Customer Name',
        'name' => 'customer_name',
    ]);

    ContentEntry::query()->create([
        'content_type_id' => $contentType->id,
        'title' => 'Draft Testimoni',
        'slug' => 'draft-testimoni',
        'status' => 'draft',
        'data' => [
            'customer_name' => 'Draft User',
        ],
    ]);

    $this->getJson('/api/v1/content/unknown-type')
        ->assertNotFound()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Content type not found');

    $this->getJson('/api/v1/content/testimonials/draft-testimoni')
        ->assertNotFound()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Content entry not found');
});

test('it returns localized dynamic content based on locale parameter', function () {
    $language = Language::firstOrCreate(
        ['code' => 'id'],
        ['english_name' => 'Indonesia', 'active' => true]
    );
    Option::updateOrCreate(['key' => 'default_language'], ['value' => 'en']);
    Option::updateOrCreate(['key' => 'languages'], ['value' => json_encode(['en', 'id'])]);

    $contentType = createApiDynamicContentType();
    $group = createApiDynamicFieldGroup($contentType);

    createApiDynamicField($group, [
        'label' => 'Customer Name',
        'name' => 'customer_name',
    ]);

    $entry = ContentEntry::create([
        'content_type_id' => $contentType->id,
        'title' => 'English Testimonial',
        'slug' => 'english-testimonial',
        'status' => 'published',
        'data' => [
            'customer_name' => 'John Doe',
        ],
    ]);

    $entry->translations()->create([
        'language_id' => $language->id,
        'title' => 'Testimoni Indonesia',
        'slug' => 'testimoni-indonesia',
        'status' => 'published',
        'data' => [
            'customer_name' => 'Budi Santoso',
        ],
    ]);

    $this->getJson('/api/v1/content/testimonials')
        ->assertSuccessful()
        ->assertJsonPath('data.0.title', 'English Testimonial')
        ->assertJsonPath('data.0.fields.customer_name', 'John Doe');

    $this->getJson('/api/v1/content/testimonials?locale=id')
        ->assertSuccessful()
        ->assertJsonPath('data.0.title', 'Testimoni Indonesia')
        ->assertJsonPath('data.0.fields.customer_name', 'Budi Santoso');

    $this->getJson('/api/v1/content/testimonials/english-testimonial')
        ->assertSuccessful()
        ->assertJsonPath('data.title', 'English Testimonial');

    $this->getJson('/api/v1/content/testimonials/english-testimonial?locale=id')
        ->assertSuccessful()
        ->assertJsonPath('data.title', 'Testimoni Indonesia')
        ->assertJsonPath('data.fields.customer_name', 'Budi Santoso');
});

test('it resolves dynamic content locales through language code, default locale, and tag without options', function () {
    $language = Language::query()->create([
        'code' => 'id',
        'english_name' => 'Indonesia',
        'active' => true,
        'default_locale' => 'id_ID',
        'tag' => 'id-ID',
    ]);

    $contentType = createApiDynamicContentType();
    $group = createApiDynamicFieldGroup($contentType);

    createApiDynamicField($group, [
        'label' => 'Customer Name',
        'name' => 'customer_name',
    ]);

    $entry = ContentEntry::query()->create([
        'content_type_id' => $contentType->id,
        'title' => 'English Testimonial',
        'slug' => 'english-testimonial',
        'status' => 'published',
        'published_at' => now()->subMinute(),
        'data' => [
            'customer_name' => 'John Doe',
        ],
    ]);

    $entry->translations()->create([
        'language_id' => $language->id,
        'title' => 'Testimoni Indonesia',
        'slug' => 'testimoni-indonesia',
        'status' => 'published',
        'published_at' => now()->subMinute(),
        'data' => [
            'customer_name' => 'Budi Santoso',
        ],
    ]);

    $this->getJson('/api/v1/content/testimonials?locale=id-ID')
        ->assertSuccessful()
        ->assertJsonPath('data.0.title', 'Testimoni Indonesia')
        ->assertJsonPath('data.0.fields.customer_name', 'Budi Santoso');

    $this->getJson('/api/v1/content/testimonials/testimoni-indonesia?locale=id_ID')
        ->assertSuccessful()
        ->assertJsonPath('data.title', 'Testimoni Indonesia')
        ->assertJsonPath('data.fields.customer_name', 'Budi Santoso');
});

test('it merges translated nested data and locale specific media with original field fallbacks', function () {
    Storage::fake('public');
    Storage::disk('public')->put('media/testimonials/budi-en.webp', 'image');
    Storage::disk('public')->put('media/testimonials/budi-id.webp', 'image');

    $language = Language::query()->create([
        'code' => 'id',
        'english_name' => 'Indonesia',
        'active' => true,
    ]);

    $contentType = createApiDynamicContentType();
    $group = createApiDynamicFieldGroup($contentType);

    createApiDynamicField($group, [
        'label' => 'Customer Photo',
        'name' => 'customer_photo',
        'type' => 'image',
        'is_required' => false,
    ]);
    createApiDynamicField($group, [
        'label' => 'Profile',
        'name' => 'profile',
        'type' => 'json',
        'is_required' => false,
        'sort_order' => 2,
    ]);

    Media::query()->create([
        'name' => 'Budi EN',
        'file_name' => 'budi-en.webp',
        'mime_type' => 'image/webp',
        'path' => 'media/testimonials/budi-en.webp',
        'disk' => 'public',
        'alt' => 'Budi Santoso EN',
    ]);

    Media::query()->create([
        'name' => 'Budi ID',
        'file_name' => 'budi-id.webp',
        'mime_type' => 'image/webp',
        'path' => 'media/testimonials/budi-id.webp',
        'disk' => 'public',
        'alt' => 'Budi Santoso ID',
    ]);

    $entry = ContentEntry::query()->create([
        'content_type_id' => $contentType->id,
        'title' => 'English Testimonial',
        'slug' => 'english-testimonial',
        'status' => 'published',
        'published_at' => now()->subMinute(),
        'data' => [
            'customer_photo' => 'media/testimonials/budi-en.webp',
            'profile' => [
                'headline' => 'Hello',
                'cta' => 'Buy now',
            ],
        ],
    ]);

    $entry->translations()->create([
        'language_id' => $language->id,
        'title' => 'Testimoni Indonesia',
        'slug' => 'testimoni-indonesia',
        'status' => 'published',
        'published_at' => now()->subMinute(),
        'data' => [
            'customer_photo' => 'media/testimonials/budi-id.webp',
            'profile' => [
                'headline' => 'Halo',
                'cta' => '',
            ],
        ],
    ]);

    $this->getJson('/api/v1/content/testimonials?locale=id')
        ->assertSuccessful()
        ->assertJsonPath('data.0.fields.customer_photo.filename', 'budi-id.webp')
        ->assertJsonPath('data.0.fields.customer_photo.alt_text', 'Budi Santoso ID')
        ->assertJsonPath('data.0.fields.profile.headline', 'Halo')
        ->assertJsonPath('data.0.fields.profile.cta', 'Buy now');
});

test('it caches dynamic content responses separately for each locale', function () {
    Cache::flush();
    config()->set('list-cache.enabled', true);
    config()->set('list-cache.taggable_stores', []);

    $language = Language::query()->create([
        'code' => 'id',
        'english_name' => 'Indonesia',
        'active' => true,
    ]);

    Option::updateOrCreate(['key' => 'default_language'], ['value' => 'en']);
    Option::updateOrCreate(['key' => 'languages'], ['value' => json_encode(['en', 'id'])]);

    $contentType = createApiDynamicContentType();
    $group = createApiDynamicFieldGroup($contentType);

    createApiDynamicField($group, [
        'label' => 'Customer Name',
        'name' => 'customer_name',
    ]);

    $entry = ContentEntry::query()->create([
        'content_type_id' => $contentType->id,
        'title' => 'English Testimonial',
        'slug' => 'english-testimonial',
        'status' => 'published',
        'published_at' => now()->subMinute(),
        'data' => [
            'customer_name' => 'John Doe',
        ],
    ]);

    $entry->translations()->create([
        'language_id' => $language->id,
        'title' => 'Testimoni Indonesia',
        'slug' => 'testimoni-indonesia',
        'status' => 'published',
        'published_at' => now()->subMinute(),
        'data' => [
            'customer_name' => 'Budi Santoso',
        ],
    ]);

    $this->getJson('/api/v1/content/testimonials')
        ->assertSuccessful()
        ->assertJsonPath('data.0.title', 'English Testimonial');

    $this->getJson('/api/v1/content/testimonials?locale=id')
        ->assertSuccessful()
        ->assertJsonPath('data.0.title', 'Testimoni Indonesia');

    $cache = app(ListCacheService::class);

    expect(Cache::get($cache->modulesRegistryKey(), []))->toContain('api.dynamic-content');
    expect(Cache::get($cache->moduleRegistryKey('api.dynamic-content'), []))->toHaveCount(2);
});
