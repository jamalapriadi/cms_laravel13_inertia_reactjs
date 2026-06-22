<?php

use App\Models\Block;
use App\Models\Dashboard\Option;
use App\Models\Page;
use App\Models\Post;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->user = User::factory()->create();

    Permission::findOrCreate('settings.view', 'web');
    Permission::findOrCreate('options.create', 'web');
    Permission::findOrCreate('posts.create', 'web');
    Permission::findOrCreate('posts.edit', 'web');
    Permission::findOrCreate('pages.create', 'web');
    Permission::findOrCreate('pages.edit', 'web');

    $this->user->givePermissionTo([
        'settings.view',
        'options.create',
        'posts.create',
        'posts.edit',
        'pages.create',
        'pages.edit',
    ]);
});

function classicRichEditorPayload(string $html): array
{
    return [[
        'type' => 'rich-editor',
        'data' => ['html' => $html],
        'styles' => [],
        'children' => [],
    ]];
}

function complexEditorPayload(): array
{
    return [
        [
            'type' => 'heading',
            'data' => ['text' => 'Heading'],
            'styles' => [],
            'children' => [],
        ],
        [
            'type' => 'paragraph',
            'data' => ['text' => 'Paragraph'],
            'styles' => [],
            'children' => [],
        ],
    ];
}

test('writing settings page shows the saved default editor', function () {
    Option::updateOrCreate(
        ['key' => 'default_content_editor'],
        ['value' => 'classic_editor']
    );

    $this->actingAs($this->user)
        ->get('/my-admin/dashboard/config/reading')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Settings/Writing')
            ->where('defaultContentEditor', 'classic_editor'));
});

test('writing settings defaults to block editor when the option is missing', function () {
    $this->actingAs($this->user)
        ->get('/my-admin/dashboard/config/reading')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Settings/Writing')
            ->where('defaultContentEditor', 'block_editor'));
});

test('writing settings validation fails for invalid editor modes', function () {
    $this->actingAs($this->user)
        ->post('/my-admin/dashboard/options', [
            'default_content_editor' => 'invalid_editor',
        ])
        ->assertSessionHasErrors('default_content_editor');
});

test('post and page create screens receive the selected editor mode', function () {
    Option::updateOrCreate(
        ['key' => 'default_content_editor'],
        ['value' => 'classic_editor']
    );

    $this->actingAs($this->user)
        ->get('/my-admin/dashboard/posts/create')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Posts/Create')
            ->where('editorMode', 'classic_editor'));

    $this->actingAs($this->user)
        ->get('/my-admin/dashboard/pages/create')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Pages/Create')
            ->where('editorMode', 'classic_editor'));
});

test('classic post content can be stored as a single rich editor block', function () {
    $html = '<p><strong>Classic</strong> editor body</p>';
    $payload = classicRichEditorPayload($html);

    $this->actingAs($this->user)
        ->post(route('posts.store'), [
            'title' => 'Classic Post',
            'status' => 'draft',
            'content' => json_encode($payload),
        ])
        ->assertRedirect(route('posts.index'));

    $post = Post::query()->where('title', 'Classic Post')->firstOrFail();

    expect($post->content)->toBe(json_encode($payload))
        ->and(Block::query()->where('post_id', $post->id)->count())->toBe(1)
        ->and(Block::query()->where('post_id', $post->id)->firstOrFail()->type)->toBe('rich-editor')
        ->and(Block::query()->where('post_id', $post->id)->firstOrFail()->props)->toBe([
            'html' => $html,
        ]);
});

test('classic page content can be stored as a single rich editor block', function () {
    $html = '<p>Classic page body</p>';
    $payload = classicRichEditorPayload($html);

    $this->actingAs($this->user)
        ->post(route('pages.store'), [
            'title' => 'Classic Page',
            'status' => 'draft',
            'blocks' => json_encode($payload),
        ])
        ->assertRedirect(route('pages.index'));

    $page = Page::query()->where('title', 'Classic Page')->firstOrFail();

    expect($page->content)->toBe(json_encode($payload))
        ->and(Block::query()->where('page_id', $page->id)->count())->toBe(1)
        ->and(Block::query()->where('page_id', $page->id)->firstOrFail()->type)->toBe('rich-editor')
        ->and(Block::query()->where('page_id', $page->id)->firstOrFail()->props)->toBe([
            'html' => $html,
        ]);
});

test('classic-compatible post and page edit screens receive the selected editor mode', function () {
    Option::updateOrCreate(
        ['key' => 'default_content_editor'],
        ['value' => 'classic_editor']
    );

    $postHtml = '<p>Existing classic post</p>';
    $pageHtml = '<p>Existing classic page</p>';
    $postPayload = classicRichEditorPayload($postHtml);
    $pagePayload = classicRichEditorPayload($pageHtml);

    $post = Post::query()->create([
        'user_id' => $this->user->id,
        'title' => 'Existing Post',
        'slug' => 'existing-post',
        'content' => json_encode($postPayload),
        'status' => 'draft',
        'type' => 'post',
    ]);
    Block::query()->create([
        'post_id' => $post->id,
        'type' => 'rich-editor',
        'props' => ['html' => $postHtml],
        'styles' => [],
        'order' => 0,
    ]);

    $page = Page::query()->create([
        'title' => 'Existing Page',
        'slug' => 'existing-page',
        'content' => json_encode($pagePayload),
        'status' => 'draft',
        'created_by' => $this->user->id,
        'updated_by' => $this->user->id,
    ]);
    Block::query()->create([
        'page_id' => $page->id,
        'type' => 'rich-editor',
        'props' => ['html' => $pageHtml],
        'styles' => [],
        'order' => 0,
    ]);

    $this->actingAs($this->user)
        ->get(route('posts.edit', $post))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Posts/Edit')
            ->where('editorMode', 'classic_editor')
            ->where('classicContent', $postHtml));

    $this->actingAs($this->user)
        ->get(route('pages.edit', $page))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Pages/Edit')
            ->where('editorMode', 'classic_editor')
            ->where('classicContent', $pageHtml));
});

test('edit screens fall back to block editor for complex block content', function () {
    Option::updateOrCreate(
        ['key' => 'default_content_editor'],
        ['value' => 'classic_editor']
    );

    $postPayload = complexEditorPayload();
    $pagePayload = complexEditorPayload();

    $post = Post::query()->create([
        'user_id' => $this->user->id,
        'title' => 'Block Post',
        'slug' => 'block-post',
        'content' => json_encode($postPayload),
        'status' => 'draft',
        'type' => 'post',
    ]);
    Block::query()->create([
        'post_id' => $post->id,
        'type' => 'heading',
        'props' => ['text' => 'Heading'],
        'styles' => [],
        'order' => 0,
    ]);
    Block::query()->create([
        'post_id' => $post->id,
        'type' => 'paragraph',
        'props' => ['text' => 'Paragraph'],
        'styles' => [],
        'order' => 1,
    ]);

    $page = Page::query()->create([
        'title' => 'Block Page',
        'slug' => 'block-page',
        'content' => json_encode($pagePayload),
        'status' => 'draft',
        'created_by' => $this->user->id,
        'updated_by' => $this->user->id,
    ]);
    Block::query()->create([
        'page_id' => $page->id,
        'type' => 'heading',
        'props' => ['text' => 'Heading'],
        'styles' => [],
        'order' => 0,
    ]);
    Block::query()->create([
        'page_id' => $page->id,
        'type' => 'paragraph',
        'props' => ['text' => 'Paragraph'],
        'styles' => [],
        'order' => 1,
    ]);

    $this->actingAs($this->user)
        ->get(route('posts.edit', $post))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Posts/Edit')
            ->where('editorMode', 'block_editor')
            ->where('classicContent', null));

    $this->actingAs($this->user)
        ->get(route('pages.edit', $page))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Pages/Edit')
            ->where('editorMode', 'block_editor')
            ->where('classicContent', null));
});
