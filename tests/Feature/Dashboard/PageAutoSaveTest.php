<?php

use App\Http\Middleware\EnsureDashboardPermission;
use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware(EnsureDashboardPermission::class);
    $this->user = User::factory()->create();
});

test('authenticated user can create an auto-draft page', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/my-admin/dashboard/pages/auto-save', [
            'title' => 'My First Page Draft',
            'excerpt' => 'Page draft excerpt',
        ]);

    $response->assertStatus(200);
    $response->assertJsonStructure(['id', 'status', 'updated_at']);

    $page = Page::first();
    expect($page->title)->toBe('My First Page Draft');
    expect($page->status)->toBe('auto-draft');
    expect($page->created_by)->toBe($this->user->id);
});

test('auto-draft page defaults empty title to Auto Draft', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/my-admin/dashboard/pages/auto-save', [
            'title' => '',
            'excerpt' => 'Some content',
        ]);

    $response->assertStatus(200);
    $page = Page::first();
    expect($page->title)->toBe('Auto Draft');
});

test('authenticated user can update their auto-draft page', function () {
    $page = Page::create([
        'created_by' => $this->user->id,
        'title' => 'Auto Draft',
        'slug' => 'auto-draft',
        'excerpt' => 'Old excerpt',
        'status' => 'auto-draft',
    ]);

    $response = $this->actingAs($this->user)
        ->putJson("/my-admin/dashboard/pages/{$page->id}/auto-save", [
            'title' => 'Updated Draft Title',
            'excerpt' => 'New excerpt',
        ]);

    $response->assertStatus(200);
    $page->refresh();
    expect($page->title)->toBe('Updated Draft Title');
    expect($page->excerpt)->toBe('New excerpt');
});

test('user cannot update someone else auto-draft page', function () {
    $otherUser = User::factory()->create();
    $page = Page::create([
        'created_by' => $otherUser->id,
        'title' => 'Other Draft',
        'slug' => 'other-draft',
        'excerpt' => 'Other excerpt',
        'status' => 'auto-draft',
    ]);

    $response = $this->actingAs($this->user)
        ->putJson("/my-admin/dashboard/pages/{$page->id}/auto-save", [
            'title' => 'Hacked Draft',
        ]);

    $response->assertStatus(403);
});

test('it does not autosave page if status is not auto-draft', function () {
    $page = Page::create([
        'created_by' => $this->user->id,
        'title' => 'Published Page',
        'slug' => 'published-page',
        'status' => 'publish',
    ]);

    $response = $this->actingAs($this->user)
        ->putJson("/my-admin/dashboard/pages/{$page->id}/auto-save", [
            'title' => 'Attempt Update',
        ]);

    $response->assertStatus(400);
});

test('latestDraft is passed to page create view when meaningful draft exists', function () {
    // Empty draft - should not be returned
    $emptyDraft = Page::create([
        'created_by' => $this->user->id,
        'title' => 'Auto Draft',
        'slug' => 'auto-draft-1',
        'content' => '[]',
        'status' => 'auto-draft',
    ]);

    $response = $this->actingAs($this->user)
        ->get('/my-admin/dashboard/pages/create');

    $response->assertStatus(200);
    expect($response->original->getData()['page']['props']['latestDraft'])->toBeNull();

    // Meaningful draft - should be returned
    $meaningfulDraft = Page::create([
        'created_by' => $this->user->id,
        'title' => 'A Real Page Idea',
        'slug' => 'a-real-page-idea',
        'content' => 'Some actual blocks content',
        'status' => 'auto-draft',
    ]);

    $response = $this->actingAs($this->user)
        ->get('/my-admin/dashboard/pages/create');

    $response->assertStatus(200);
    $latestDraftProp = $response->original->getData()['page']['props']['latestDraft'];
    expect($latestDraftProp)->not->toBeNull();
    expect($latestDraftProp['id'])->toBe($meaningfulDraft->id);
    expect($latestDraftProp['title'])->toBe('A Real Page Idea');
});
