<?php

use App\Models\Dashboard\Language;
use App\Models\Dashboard\Option;
use App\Models\Shop\SiteContent;
use App\Models\Shop\SiteContentTranslation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Setup default options for ActiveLanguageService
    Option::query()->create(['key' => 'languages', 'value' => json_encode(['en', 'id'])]);
    Option::query()->create(['key' => 'default_language', 'value' => 'en']);

    Language::query()->create([
        'code' => 'en',
        'english_name' => 'English',
        'is_active' => true,
    ]);

    Language::query()->create([
        'code' => 'id',
        'english_name' => 'Indonesian',
        'is_active' => true,
    ]);
});

test('it retrieves all active site contents in default grouped format', function () {
    $content1 = SiteContent::query()->create(['key' => 'homepage.hero.title', 'group' => 'homepage', 'type' => 'text', 'is_active' => true]);
    SiteContentTranslation::query()->create(['site_content_id' => $content1->id, 'locale' => 'en', 'value' => 'Welcome English']);
    SiteContentTranslation::query()->create(['site_content_id' => $content1->id, 'locale' => 'id', 'value' => 'Selamat Datang']);

    $content2 = SiteContent::query()->create(['key' => 'footer.copyright', 'group' => 'footer', 'type' => 'text', 'is_active' => true]);
    SiteContentTranslation::query()->create(['site_content_id' => $content2->id, 'locale' => 'en', 'value' => 'Copyright 2026']);

    $response = $this->getJson('/api/v1/site-contents?locale=en');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Site contents retrieved successfully.',
            'data' => [
                'homepage' => [
                    'homepage.hero.title' => 'Welcome English',
                ],
                'footer' => [
                    'footer.copyright' => 'Copyright 2026',
                ],
            ],
        ]);
});

test('it filters site contents by group', function () {
    $content1 = SiteContent::query()->create(['key' => 'homepage.title', 'group' => 'homepage', 'type' => 'text', 'is_active' => true]);
    SiteContentTranslation::query()->create(['site_content_id' => $content1->id, 'locale' => 'en', 'value' => 'Home']);

    $content2 = SiteContent::query()->create(['key' => 'footer.text', 'group' => 'footer', 'type' => 'text', 'is_active' => true]);
    SiteContentTranslation::query()->create(['site_content_id' => $content2->id, 'locale' => 'en', 'value' => 'Footer']);

    $response = $this->getJson('/api/v1/site-contents?group=homepage&locale=en');

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'homepage' => [
                    'homepage.title' => 'Home',
                ],
            ],
        ])
        ->assertJsonMissingPath('data.footer');
});

test('it returns site contents in list format when requested', function () {
    $content = SiteContent::query()->create(['key' => 'homepage.title', 'group' => 'homepage', 'type' => 'text', 'is_active' => true]);
    SiteContentTranslation::query()->create(['site_content_id' => $content->id, 'locale' => 'en', 'value' => 'Home']);

    $response = $this->getJson('/api/v1/site-contents?format=list&locale=en');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                [
                    'key' => 'homepage.title',
                    'group' => 'homepage',
                    'locale' => 'en',
                    'type' => 'text',
                    'value' => 'Home',
                ],
            ],
        ]);
});

test('it retrieves a single site content by key', function () {
    $content = SiteContent::query()->create(['key' => 'hero_title', 'group' => 'homepage', 'type' => 'text', 'is_active' => true]);
    SiteContentTranslation::query()->create(['site_content_id' => $content->id, 'locale' => 'en', 'value' => 'Hello']);

    $response = $this->getJson('/api/v1/site-contents/hero_title?locale=en');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'key' => 'hero_title',
                'group' => 'homepage',
                'locale' => 'en',
                'type' => 'text',
                'value' => 'Hello',
            ],
        ]);
});

test('it falls back to group retrieval for single route if key is not found', function () {
    $content = SiteContent::query()->create(['key' => 'homepage.title', 'group' => 'homepage', 'type' => 'text', 'is_active' => true]);
    SiteContentTranslation::query()->create(['site_content_id' => $content->id, 'locale' => 'en', 'value' => 'Home']);

    // 'homepage' is a group, not a key
    $response = $this->getJson('/api/v1/site-contents/homepage?locale=en');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Site content group retrieved successfully.',
            'data' => [
                'group' => 'homepage',
                'contents' => [
                    'homepage.title' => 'Home',
                ],
            ],
        ]);
});

test('it returns 404 for missing key or group', function () {
    $response = $this->getJson('/api/v1/site-contents/nonexistent_key');

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Site content not found.',
        ]);
});

test('it does not expose inactive content', function () {
    $content = SiteContent::query()->create(['key' => 'hidden_key', 'group' => 'homepage', 'type' => 'text', 'is_active' => false]);
    SiteContentTranslation::query()->create(['site_content_id' => $content->id, 'locale' => 'en', 'value' => 'Secret']);

    $response = $this->getJson('/api/v1/site-contents');
    $response->assertJsonMissingPath('data.homepage.hidden_key');

    $singleResponse = $this->getJson('/api/v1/site-contents/hidden_key');
    $singleResponse->assertStatus(404);
});

test('it normalizes content values correctly by type', function () {
    Storage::fake('public');

    // Text type
    $text = SiteContent::query()->create(['key' => 'c_text', 'group' => 'c', 'type' => 'text', 'is_active' => true]);
    SiteContentTranslation::query()->create(['site_content_id' => $text->id, 'locale' => 'en', 'value' => 'Hello']);

    // Boolean type
    $bool = SiteContent::query()->create(['key' => 'c_bool', 'group' => 'c', 'type' => 'boolean', 'is_active' => true]);
    SiteContentTranslation::query()->create(['site_content_id' => $bool->id, 'locale' => 'en', 'value' => '1']);

    // Number type
    $num = SiteContent::query()->create(['key' => 'c_num', 'group' => 'c', 'type' => 'number', 'is_active' => true]);
    SiteContentTranslation::query()->create(['site_content_id' => $num->id, 'locale' => 'en', 'value' => '12.34']);

    // JSON type
    $json = SiteContent::query()->create(['key' => 'c_json', 'group' => 'c', 'type' => 'json', 'is_active' => true]);
    SiteContentTranslation::query()->create(['site_content_id' => $json->id, 'locale' => 'en', 'value' => '{"foo":"bar"}']);

    // Image type
    $img = SiteContent::query()->create(['key' => 'c_img', 'group' => 'c', 'type' => 'image', 'is_active' => true]);
    SiteContentTranslation::query()->create(['site_content_id' => $img->id, 'locale' => 'en', 'value' => 'uploads/pic.jpg']);

    $response = $this->getJson('/api/v1/site-contents?group=c&locale=en');

    $response->assertStatus(200);
    $data = $response->json('data.c');

    expect($data['c_text'])->toBe('Hello')
        ->and($data['c_bool'])->toBeTrue()
        ->and($data['c_num'])->toBe(12.34)
        ->and($data['c_json'])->toBe(['foo' => 'bar'])
        ->and($data['c_img'])->toContain('/storage/uploads/pic.jpg');
});

test('it implements combined site-config endpoint successfully', function () {
    Option::query()->create(['key' => 'site_title', 'value' => 'Config Title']);
    $content = SiteContent::query()->create(['key' => 'homepage.title', 'group' => 'homepage', 'type' => 'text', 'is_active' => true]);
    SiteContentTranslation::query()->create(['site_content_id' => $content->id, 'locale' => 'en', 'value' => 'Welcome']);

    $response = $this->getJson('/api/v1/site-config?locale=en');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Site configuration retrieved successfully.',
        ])
        ->assertJsonPath('data.general.site_name', 'Config Title');

    expect($response->json('data.site_contents.homepage')['homepage.title'])->toBe('Welcome');
});

test('it invalidates site contents cache on updates', function () {
    config(['list-cache.enabled' => true]);

    $content = SiteContent::query()->create(['key' => 'homepage.title', 'group' => 'homepage', 'type' => 'text', 'is_active' => true]);
    $translation = SiteContentTranslation::query()->create(['site_content_id' => $content->id, 'locale' => 'en', 'value' => 'Old Title']);

    // Cache the first response
    $res1 = $this->getJson('/api/v1/site-contents?locale=en');
    expect($res1->json('data.homepage')['homepage.title'])->toBe('Old Title');

    // Update value directly in database (cache remains old)
    SiteContentTranslation::query()->where('id', $translation->id)->update(['value' => 'Direct DB Update']);
    $res2 = $this->getJson('/api/v1/site-contents?locale=en');
    expect($res2->json('data.homepage')['homepage.title'])->toBe('Old Title');

    // Update via model to trigger events
    $translation = SiteContentTranslation::query()->find($translation->id);
    $translation->update(['value' => 'New Title']);

    // Cache should be invalidated and return new title
    $res3 = $this->getJson('/api/v1/site-contents?locale=en');
    expect($res3->json('data.homepage')['homepage.title'])->toBe('New Title');
});
