<?php

use App\Models\Dashboard\Option;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('general settings stores uploaded asset urls under asset option keys', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->post('/my-admin/dashboard/options', [
            'site_title' => 'Gita Trading',
            'favicon_ico_url' => '/storage/media/2026/05/favicon.ico',
            'logo_url' => '/storage/media/2026/05/logo.webp',
            'logo_footer_url' => '/storage/media/2026/05/logo-footer.webp',
            'logo_mobile_url' => '/storage/media/2026/05/logo-mobile.webp',
        ])
        ->assertRedirect();

    expect(Option::query()->where('key', 'favicon_ico')->value('value'))
        ->toBe('/storage/media/2026/05/favicon.ico')
        ->and(Option::query()->where('key', 'logo')->value('value'))
        ->toBe('/storage/media/2026/05/logo.webp')
        ->and(Option::query()->where('key', 'logo_footer')->value('value'))
        ->toBe('/storage/media/2026/05/logo-footer.webp')
        ->and(Option::query()->where('key', 'logo_mobile')->value('value'))
        ->toBe('/storage/media/2026/05/logo-mobile.webp');
});

test('general settings can clear asset urls', function () {
    $user = User::factory()->create();

    Option::query()->create([
        'key' => 'logo',
        'value' => '/storage/media/2026/05/logo.webp',
    ]);

    $this
        ->actingAs($user)
        ->post('/my-admin/dashboard/options', [
            'logo_url' => '',
        ])
        ->assertRedirect();

    expect(Option::query()->where('key', 'logo')->value('value'))->toBeNull();
});

test('option value returns scalar strings and decoded arrays', function () {
    Option::query()->create([
        'key' => 'logo',
        'value' => '/storage/media/logo.webp',
    ]);

    Option::query()->create([
        'key' => 'marketplace',
        'value' => json_encode([
            ['display_name' => 'Tokopedia', 'value' => 'https://tokopedia.com'],
        ]),
    ]);

    expect(Option::query()->where('key', 'logo')->first()->value)
        ->toBe('/storage/media/logo.webp')
        ->and(Option::query()->where('key', 'marketplace')->first()->value)
        ->toBe([
            ['display_name' => 'Tokopedia', 'value' => 'https://tokopedia.com'],
        ]);
});

test('media json upload keeps ico files as ico assets', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $file = UploadedFile::fake()->create('favicon.ico', 1, 'image/x-icon');

    $response = $this
        ->actingAs($user)
        ->post('/my-admin/dashboard/media/json', [
            'file' => $file,
        ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('location', fn (string $location) => str_ends_with($location, '.ico'));
});
