<?php

use App\Models\Dashboard\Option;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('it retrieves general configurations with formatted values', function () {
    // Setup general configuration options in the database
    Option::query()->create(['key' => 'site_title', 'value' => 'Gitatrading Store']);
    Option::query()->create(['key' => 'tagline', 'value' => 'Empowering Traders']);
    Option::query()->create(['key' => 'description', 'value' => 'A great place to shop']);
    Option::query()->create(['key' => 'short_description', 'value' => 'Shop description']);
    Option::query()->create(['key' => 'logo', 'value' => 'settings/logo.webp']);
    Option::query()->create(['key' => 'logo_footer', 'value' => 'settings/logo-footer.webp']);
    Option::query()->create(['key' => 'logo_mobile', 'value' => 'settings/logo-mobile.webp']);
    Option::query()->create(['key' => 'favicon_ico', 'value' => 'settings/favicon.ico']);
    Option::query()->create(['key' => 'email_instansi', 'value' => 'admin@gitatrading-store.com']);
    Option::query()->create(['key' => 'phone_instansi', 'value' => '+628123456789']);
    Option::query()->create(['key' => 'whatsapp_instansi', 'value' => '+628123456789']);
    Option::query()->create(['key' => 'alamat_instansi', 'value' => '123 Tech Street']);

    Option::query()->create([
        'key' => 'social_media',
        'value' => json_encode([
            ['key' => 'facebook', 'display_name' => 'Facebook', 'value' => 'https://facebook.com/gitatrading'],
            ['key' => 'instagram', 'display_name' => 'Instagram', 'value' => 'https://instagram.com/gitatrading'],
        ]),
    ]);

    Option::query()->create([
        'key' => 'marketplace',
        'value' => json_encode([
            ['display_name' => 'Tokopedia', 'value' => 'https://tokopedia.com/gitatrading'],
        ]),
    ]);

    Option::query()->create(['key' => 'meta_description', 'value' => 'Gitatrading SEO Description']);
    Option::query()->create(['key' => 'meta_keyword', 'value' => 'trading, shop, store']);

    // Admin/sensitive option
    Option::query()->create(['key' => 'default_content_editor', 'value' => 'block']);

    $response = $this->getJson('/api/v1/options/general');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'General configuration retrieved successfully.',
        ])
        ->assertJsonPath('data.site_name', 'Gitatrading Store')
        ->assertJsonPath('data.site_tagline', 'Empowering Traders')
        ->assertJsonPath('data.site_description', 'A great place to shop')
        ->assertJsonPath('data.site_short_description', 'Shop description')
        ->assertJsonPath('data.contact.email', 'admin@gitatrading-store.com')
        ->assertJsonPath('data.contact.phone', '+628123456789')
        ->assertJsonPath('data.contact.whatsapp', '+628123456789')
        ->assertJsonPath('data.contact.address', '123 Tech Street')
        ->assertJsonPath('data.social_media.facebook', 'https://facebook.com/gitatrading')
        ->assertJsonPath('data.social_media.instagram', 'https://instagram.com/gitatrading')
        ->assertJsonPath('data.social_media.x', null)
        ->assertJsonPath('data.marketplace.tokopedia', 'https://tokopedia.com/gitatrading')
        ->assertJsonPath('data.seo.meta_title', 'Gitatrading Store')
        ->assertJsonPath('data.seo.meta_description', 'Gitatrading SEO Description')
        ->assertJsonPath('data.seo.meta_keywords', 'trading, shop, store');

    // Assert images/favicon have full storage URLs
    $logoUrl = $response->json('data.site_logo');
    $faviconUrl = $response->json('data.site_favicon');

    expect($logoUrl)->toContain('storage/settings/logo.webp')
        ->and($faviconUrl)->toContain('storage/settings/favicon.ico');

    // Assert sensitive information is NOT exposed
    $response->assertJsonMissingPath('data.default_content_editor');
});

test('it retrieves preferences configurations with casted values', function () {
    Option::query()->create(['key' => 'preferences_theme_default_mode', 'value' => 'dark']);
    Option::query()->create(['key' => 'preferences_primary_color', 'value' => '#ff0000']);
    Option::query()->create(['key' => 'preferences_secondary_color', 'value' => '#00ff00']);
    Option::query()->create(['key' => 'preferences_container_width', 'value' => 'wide']);
    Option::query()->create(['key' => 'preferences_enable_breadcrumb', 'value' => '0']); // should cast to false
    Option::query()->create(['key' => 'preferences_enable_sticky_header', 'value' => '1']); // should cast to true
    Option::query()->create(['key' => 'preferences_show_product_rating', 'value' => 'true']); // should cast to true
    Option::query()->create(['key' => 'preferences_show_product_stock', 'value' => 'false']); // should cast to false
    Option::query()->create(['key' => 'preferences_show_product_sku', 'value' => '1']); // should cast to true
    Option::query()->create(['key' => 'preferences_show_blog_author', 'value' => '0']); // should cast to false
    Option::query()->create(['key' => 'preferences_show_blog_date', 'value' => '1']); // should cast to true
    Option::query()->create(['key' => 'preferences_currency_code', 'value' => 'USD']);
    Option::query()->create(['key' => 'preferences_currency_symbol', 'value' => '$']);
    Option::query()->create(['key' => 'preferences_currency_position', 'value' => 'after']);
    Option::query()->create(['key' => 'preferences_default_language', 'value' => 'id']);
    Option::query()->create(['key' => 'preferences_timezone', 'value' => 'Asia/Jakarta']);
    Option::query()->create(['key' => 'meta_keyword', 'value' => 'trading, market']);
    Option::query()->create(['key' => 'meta_description', 'value' => 'Trading store']);
    Option::query()->create(['key' => 'robot_txt', 'value' => 'User-agent: *']);
    Option::query()->create(['key' => 'code_snippet_head', 'value' => '<script></script>']);
    Option::query()->create(['key' => 'social_sharing_image', 'value' => 'settings/share.png']);
    Option::query()->create(['key' => 'email_recipient', 'value' => 'recipient@awesome.com']);

    $response = $this->getJson('/api/v1/options/preferences');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Preferences configuration retrieved successfully.',
            'data' => [
                'theme' => [
                    'default_mode' => 'dark',
                    'primary_color' => '#ff0000',
                    'secondary_color' => '#00ff00',
                ],
                'layout' => [
                    'container_width' => 'wide',
                    'enable_breadcrumb' => false,
                    'enable_sticky_header' => true,
                ],
                'display' => [
                    'show_product_rating' => true,
                    'show_product_stock' => false,
                    'show_product_sku' => true,
                    'show_blog_author' => false,
                    'show_blog_date' => true,
                ],
                'currency' => [
                    'code' => 'USD',
                    'symbol' => '$',
                    'position' => 'after',
                ],
                'locale' => [
                    'default_language' => 'id',
                    'timezone' => 'Asia/Jakarta',
                ],
                'seo' => [
                    'meta_keywords' => 'trading, market',
                    'meta_description' => 'Trading store',
                ],
                'snippets' => [
                    'robot_txt' => 'User-agent: *',
                    'head' => '<script></script>',
                    'body' => null,
                    'footer' => null,
                ],
                'email_recipient' => 'recipient@awesome.com',
            ],
        ]);

    $shareUrl = $response->json('data.social_sharing_image');
    expect($shareUrl)->toContain('storage/settings/share.png');
});

test('it handles missing options safely', function () {
    $response = $this->getJson('/api/v1/options/general');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'General configuration retrieved successfully.',
            'data' => [
                'site_name' => 'Gitatrading Store', // fallback default
                'site_tagline' => null,
                'site_logo' => null,
                'contact' => [
                    'email' => null,
                    'phone' => null,
                    'address' => null,
                ],
                'social_media' => [
                    'facebook' => null,
                    'instagram' => null,
                ],
                'marketplace' => [],
                'seo' => [
                    'meta_title' => null,
                    'meta_description' => null,
                ],
            ],
        ]);

    $prefResponse = $this->getJson('/api/v1/options/preferences');
    $prefResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Preferences configuration retrieved successfully.',
            'data' => [
                'theme' => [
                    'default_mode' => 'light',
                    'primary_color' => '#10b981',
                    'secondary_color' => '#111827',
                ],
                'layout' => [
                    'container_width' => 'default',
                    'enable_breadcrumb' => true,
                    'enable_sticky_header' => true,
                ],
                'display' => [
                    'show_product_rating' => true,
                    'show_product_stock' => true,
                ],
                'currency' => [
                    'code' => 'JPY',
                    'symbol' => '¥',
                    'position' => 'before',
                ],
                'locale' => [
                    'default_language' => 'en',
                    'timezone' => 'Asia/Tokyo',
                ],
            ],
        ]);
});

test('it retrieves combined options successfully', function () {
    Option::query()->create(['key' => 'site_title', 'value' => 'Gita Store']);
    Option::query()->create(['key' => 'preferences_theme_default_mode', 'value' => 'dark']);

    $response = $this->getJson('/api/v1/options');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Website options retrieved successfully.',
        ])
        ->assertJsonPath('data.general.site_name', 'Gita Store')
        ->assertJsonPath('data.preferences.theme.default_mode', 'dark');
});

test('it invalidates list cache when options are updated', function () {
    // Enable cache during test
    config(['list-cache.enabled' => true]);

    Option::query()->create(['key' => 'site_title', 'value' => 'Old Title']);
    Option::query()->create(['key' => 'preferences_theme_default_mode', 'value' => 'light']);

    // First requests populate caches
    $this->getJson('/api/v1/options/general')->assertJsonPath('data.site_name', 'Old Title');
    $this->getJson('/api/v1/options/preferences')->assertJsonPath('data.theme.default_mode', 'light');
    $this->getJson('/api/v1/options')->assertJsonPath('data.general.site_name', 'Old Title');

    // Directly modify database (simulate background/tinker update, does not fire Eloquent events)
    Option::query()->where('key', 'site_title')->update(['value' => 'Directly Updated Title']);
    Option::query()->where('key', 'preferences_theme_default_mode')->update(['value' => 'dark']);

    // Request should still return cached old values
    $this->getJson('/api/v1/options/general')->assertJsonPath('data.site_name', 'Old Title');
    $this->getJson('/api/v1/options/preferences')->assertJsonPath('data.theme.default_mode', 'light');
    $this->getJson('/api/v1/options')->assertJsonPath('data.general.site_name', 'Old Title');

    // Retrieve via model and save/update to trigger Eloquent events/observer
    $option1 = Option::query()->where('key', 'site_title')->first();
    $option1->update(['value' => 'New Awesome Title']);

    $option2 = Option::query()->where('key', 'preferences_theme_default_mode')->first();
    $option2->update(['value' => 'dark']);

    // Cache should be cleared and retrieve the updated title and mode
    $this->getJson('/api/v1/options/general')->assertJsonPath('data.site_name', 'New Awesome Title');
    $this->getJson('/api/v1/options/preferences')->assertJsonPath('data.theme.default_mode', 'dark');
    $this->getJson('/api/v1/options')->assertJsonPath('data.general.site_name', 'New Awesome Title');
});
