<?php

use App\Http\Middleware\EnsureDashboardPermission;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware(EnsureDashboardPermission::class);
    $this->user = User::factory()->create();
});

test('authenticated user can create an auto-draft post', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/my-admin/dashboard/posts/auto-save', [
            'title' => 'My First Draft',
            'content' => json_encode([['type' => 'paragraph', 'data' => ['text' => 'Draft content here']]]),
        ]);

    $response->assertStatus(200);
    $response->assertJsonStructure(['id', 'status', 'updated_at']);

    $post = Post::first();
    expect($post->title)->toBe('My First Draft');
    expect($post->status)->toBe('auto-draft');
    expect($post->user_id)->toBe($this->user->id);
});

test('auto-draft defaults empty title to Auto Draft', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/my-admin/dashboard/posts/auto-save', [
            'title' => '',
            'content' => json_encode([['type' => 'paragraph', 'data' => ['text' => 'Some content']]]),
        ]);

    $response->assertStatus(200);
    $post = Post::first();
    expect($post->title)->toBe('Auto Draft');
});

test('authenticated user can update their auto-draft post', function () {
    $post = Post::create([
        'user_id' => $this->user->id,
        'title' => 'Auto Draft',
        'slug' => 'auto-draft',
        'content' => json_encode([['type' => 'paragraph', 'data' => ['text' => 'Old content']]]),
        'status' => 'auto-draft',
        'type' => 'post',
    ]);

    $response = $this->actingAs($this->user)
        ->putJson("/my-admin/dashboard/posts/{$post->id}/auto-save", [
            'title' => 'Updated Draft Title',
            'content' => json_encode([['type' => 'paragraph', 'data' => ['text' => 'New content']]]),
        ]);

    $response->assertStatus(200);
    $post->refresh();
    expect($post->title)->toBe('Updated Draft Title');
    expect(json_decode($post->content, true)[0]['data']['text'])->toBe('New content');
});

test('user cannot update someone else auto-draft post', function () {
    $otherUser = User::factory()->create();
    $post = Post::create([
        'user_id' => $otherUser->id,
        'title' => 'Other Draft',
        'slug' => 'other-draft',
        'content' => json_encode([['type' => 'paragraph', 'data' => ['text' => 'Other content']]]),
        'status' => 'auto-draft',
        'type' => 'post',
    ]);

    $response = $this->actingAs($this->user)
        ->putJson("/my-admin/dashboard/posts/{$post->id}/auto-save", [
            'title' => 'Hacked Draft',
        ]);

    $response->assertStatus(403);
});

test('it does not autosave if status is not auto-draft', function () {
    $post = Post::create([
        'user_id' => $this->user->id,
        'title' => 'Published Post',
        'slug' => 'published-post',
        'content' => json_encode([['type' => 'paragraph', 'data' => ['text' => 'Published content']]]),
        'status' => 'publish',
        'type' => 'post',
    ]);

    $response = $this->actingAs($this->user)
        ->putJson("/my-admin/dashboard/posts/{$post->id}/auto-save", [
            'title' => 'Attempt Update',
        ]);

    $response->assertStatus(400);
});

test('latestDraft is passed to create view when meaningful draft exists', function () {
    // Empty draft - should not be returned
    $emptyDraft = Post::create([
        'user_id' => $this->user->id,
        'title' => 'Auto Draft',
        'slug' => 'auto-draft-1',
        'content' => '[]',
        'status' => 'auto-draft',
        'type' => 'post',
    ]);

    $response = $this->actingAs($this->user)
        ->get('/my-admin/dashboard/posts/create');

    $response->assertStatus(200);
    expect($response->original->getData()['page']['props']['latestDraft'])->toBeNull();

    // Meaningful draft - should be returned
    $meaningfulDraft = Post::create([
        'user_id' => $this->user->id,
        'title' => 'A Real Post Idea',
        'slug' => 'a-real-post-idea',
        'content' => json_encode([['type' => 'paragraph', 'data' => ['text' => 'Some actual content']]]),
        'status' => 'auto-draft',
        'type' => 'post',
    ]);

    $response = $this->actingAs($this->user)
        ->get('/my-admin/dashboard/posts/create');

    $response->assertStatus(200);
    $latestDraftProp = $response->original->getData()['page']['props']['latestDraft'];
    expect($latestDraftProp)->not->toBeNull();
    expect($latestDraftProp['id'])->toBe($meaningfulDraft->id);
    expect($latestDraftProp['title'])->toBe('A Real Post Idea');
});
