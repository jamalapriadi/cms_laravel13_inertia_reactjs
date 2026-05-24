<?php

use App\Models\Block;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\Term;
use App\Models\TermTaxonomy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function nestedPostBlocks(): array
{
    return [
        [
            'type' => 'section',
            'data' => ['padding' => '48px 24px', 'background' => '#ffffff'],
            'styles' => [],
            'children' => [
                [
                    'type' => 'container',
                    'data' => ['maxWidth' => '1120px', 'padding' => '24px', 'align' => 'center'],
                    'styles' => [],
                    'children' => [
                        [
                            'type' => 'heading',
                            'data' => ['text' => 'Hero title', 'level' => 'h1'],
                            'styles' => [],
                            'children' => [],
                        ],
                        [
                            'type' => 'paragraph',
                            'data' => ['text' => 'Hero paragraph'],
                            'styles' => [],
                            'children' => [],
                        ],
                        [
                            'type' => 'rich-editor',
                            'data' => ['html' => '<p><strong>Rich</strong> content</p>'],
                            'styles' => [],
                            'children' => [],
                        ],
                        [
                            'type' => 'card',
                            'data' => [
                                'padding' => '24px',
                                'background' => '#ffffff',
                                'borderColor' => '#e5e7eb',
                                'shadow' => true,
                            ],
                            'styles' => [],
                            'children' => [
                                [
                                    'type' => 'button',
                                    'data' => ['text' => 'Learn more', 'url' => '#'],
                                    'styles' => [],
                                    'children' => [],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ];
}

test('it stores a post with nested editor blocks', function () {
    $user = User::factory()->create();
    $blocks = nestedPostBlocks();

    $response = $this->actingAs($user)->post(route('posts.store'), [
        'title' => 'Block Builder Post',
        'status' => 'draft',
        'content' => json_encode($blocks),
    ]);

    $response->assertRedirect(route('posts.index'));

    $post = Post::query()->where('title', 'Block Builder Post')->firstOrFail();

    expect($post->blocks)->toHaveCount(7)
        ->and($post->content)->toBe(json_encode($blocks));

    $section = Block::query()->where('post_id', $post->id)->where('type', 'section')->firstOrFail();
    $container = Block::query()->where('post_id', $post->id)->where('type', 'container')->firstOrFail();
    $heading = Block::query()->where('post_id', $post->id)->where('type', 'heading')->firstOrFail();
    $paragraph = Block::query()->where('post_id', $post->id)->where('type', 'paragraph')->firstOrFail();
    $richEditor = Block::query()->where('post_id', $post->id)->where('type', 'rich-editor')->firstOrFail();
    $card = Block::query()->where('post_id', $post->id)->where('type', 'card')->firstOrFail();
    $button = Block::query()->where('post_id', $post->id)->where('type', 'button')->firstOrFail();

    expect($container->parent_id)->toBe($section->id)
        ->and($heading->parent_id)->toBe($container->id)
        ->and($paragraph->parent_id)->toBe($container->id)
        ->and($richEditor->parent_id)->toBe($container->id)
        ->and($card->parent_id)->toBe($container->id)
        ->and($button->parent_id)->toBe($card->id)
        ->and($heading->props)->toBe(['text' => 'Hero title', 'level' => 'h1'])
        ->and($paragraph->props)->toBe(['text' => 'Hero paragraph'])
        ->and($richEditor->props)->toBe(['html' => '<p><strong>Rich</strong> content</p>']);
});

test('it replaces nested editor blocks when updating a post', function () {
    $user = User::factory()->create();
    $post = Post::query()->create([
        'user_id' => $user->id,
        'title' => 'Old title',
        'slug' => 'old-title',
        'status' => 'draft',
        'type' => 'post',
    ]);

    Block::query()->create([
        'post_id' => $post->id,
        'type' => 'heading',
        'props' => ['text' => 'Old heading'],
        'styles' => [],
        'order' => 0,
    ]);

    $blocks = nestedPostBlocks();
    $blocks[0]['children'][0]['children'][0]['data']['text'] = 'Updated heading';

    $response = $this->actingAs($user)->put(route('posts.update', $post), [
        'title' => 'Updated title',
        'status' => 'publish',
        'blocks' => json_encode($blocks),
    ]);

    $response->assertRedirect(route('posts.index'));

    $post->refresh();

    expect($post->title)->toBe('Updated title')
        ->and($post->status)->toBe('publish')
        ->and($post->published_at)->not->toBeNull()
        ->and($post->blocks)->toHaveCount(7);

    $container = Block::query()->where('post_id', $post->id)->where('type', 'container')->firstOrFail();
    $heading = Block::query()->where('post_id', $post->id)->where('type', 'heading')->firstOrFail();

    expect($heading->parent_id)->toBe($container->id)
        ->and($heading->props)->toBe(['text' => 'Updated heading', 'level' => 'h1'])
        ->and(Block::query()->where('post_id', $post->id)->where('props->text', 'Old heading')->exists())->toBeFalse();
});

test('it stores post category tags and featured image metadata', function () {
    $user = User::factory()->create();
    $category = PostCategory::query()->create([
        'user_id' => $user->id,
        'category_name' => 'Market News',
        'slug' => 'market-news',
    ]);

    $tag = TermTaxonomy::query()->create([
        'term_id' => Term::query()->create([
            'name' => 'Trading',
            'slug' => 'trading',
        ])->id,
        'taxonomy' => 'tags',
    ]);

    $response = $this->actingAs($user)->post(route('posts.store'), [
        'title' => 'Post Metadata',
        'status' => 'draft',
        'content' => json_encode([]),
        'category_id' => $category->id,
        'tag_names' => ['Trading', 'Breakout'],
        'featured_image' => 'posts/featured-image.jpg',
        'published_at' => '2026-05-24 09:30:00',
    ]);

    $response->assertRedirect(route('posts.index'));

    $post = Post::query()
        ->where('title', 'Post Metadata')
        ->firstOrFail();

    expect($post->metas()->where('meta_key', 'post_category_id')->value('meta_value'))->toBe($category->id)
        ->and($post->tags()->with('term')->get()->pluck('term.name')->all())->toBe(['Trading', 'Breakout'])
        ->and($post->featuredImage()->value('meta_value'))->toBe('posts/featured-image.jpg')
        ->and($post->published_at?->format('Y-m-d H:i:s'))->toBe('2026-05-24 09:30:00')
        ->and($tag->refresh()->count)->toBe(1);
});
