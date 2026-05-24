<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('media page lists folders and files from public storage', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    Storage::disk('public')->put('media/2026/05/logo.webp', 'image');
    Storage::disk('public')->put('documents/manual.pdf', 'document');

    $response = $this
        ->actingAs($user)
        ->get('/dashboard/media');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Media/Index')
        ->where('currentPath', '')
        ->has('storageItems', 2)
        ->where('storageItems.0.type', 'folder')
        ->where('storageItems.0.name', 'documents')
        ->where('storageItems.1.type', 'folder')
        ->where('storageItems.1.name', 'media')
    );
});

test('media page can open a storage folder', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    Storage::disk('public')->put('media/2026/05/logo.webp', 'image');

    $response = $this
        ->actingAs($user)
        ->get('/dashboard/media?path=media/2026/05');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Media/Index')
        ->where('currentPath', 'media/2026/05')
        ->where('breadcrumbs.0.name', 'media')
        ->where('breadcrumbs.1.name', '2026')
        ->where('breadcrumbs.2.name', '05')
        ->where('storageItems.0.type', 'file')
        ->where('storageItems.0.name', 'logo.webp')
    );
});

test('media storage file can be permanently deleted', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    Storage::disk('public')->put('media/2026/05/logo.webp', 'image');

    $this
        ->actingAs($user)
        ->delete(route('dashboard.media.storage-file.destroy'), [
            'path' => 'media/2026/05/logo.webp',
        ])
        ->assertRedirect();

    Storage::disk('public')->assertMissing('media/2026/05/logo.webp');
});

test('media upload converts supported images to webp', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post('/dashboard/media', [
            'file' => UploadedFile::fake()->image('avatar.jpg', 100, 100),
        ]);

    $response->assertRedirect();

    $files = Storage::disk('public')->allFiles('media');

    expect($files)
        ->toHaveCount(1)
        ->and($files[0])
        ->toEndWith('.webp');
});
