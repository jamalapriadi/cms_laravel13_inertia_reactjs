<?php

use App\Http\Middleware\EnsureDashboardPermission;
use App\Models\Block;
use App\Models\BlockTranslation;
use App\Models\Dashboard\Language;
use App\Models\Page;
use App\Models\PageTranslation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function nestedPageBlocks(): array
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
                            'data' => ['text' => 'About title', 'level' => 'h1'],
                            'styles' => [],
                            'children' => [],
                        ],
                        [
                            'type' => 'paragraph',
                            'data' => ['text' => 'About paragraph'],
                            'styles' => [],
                            'children' => [],
                        ],
                    ],
                ],
            ],
        ],
    ];
}

test('it stores a page with nested editor blocks', function () {
    $this->withoutMiddleware(EnsureDashboardPermission::class);

    $user = User::factory()->create();
    $blocks = nestedPageBlocks();

    $response = $this->actingAs($user)->post(route('pages.store'), [
        'title' => 'About Us',
        'slug' => 'about-us',
        'status' => 'draft',
        'blocks' => json_encode($blocks),
        'excerpt' => 'About page excerpt',
        'seo_title' => 'About Gita Trading',
    ]);

    $response->assertRedirect(route('pages.index'));

    $page = Page::query()->where('slug', 'about-us')->firstOrFail();

    expect($page->blocks)->toHaveCount(4)
        ->and($page->content)->toBe(json_encode($blocks))
        ->and($page->excerpt)->toBe('About page excerpt')
        ->and($page->seo_title)->toBe('About Gita Trading');

    $section = Block::query()->where('page_id', $page->id)->where('type', 'section')->firstOrFail();
    $container = Block::query()->where('page_id', $page->id)->where('type', 'container')->firstOrFail();
    $heading = Block::query()->where('page_id', $page->id)->where('type', 'heading')->firstOrFail();
    $paragraph = Block::query()->where('page_id', $page->id)->where('type', 'paragraph')->firstOrFail();

    expect($section->post_id)->toBeNull()
        ->and($container->parent_id)->toBe($section->id)
        ->and($heading->parent_id)->toBe($container->id)
        ->and($paragraph->parent_id)->toBe($container->id)
        ->and($heading->props)->toBe(['text' => 'About title', 'level' => 'h1']);
});

test('it replaces nested editor blocks when updating a page', function () {
    $this->withoutMiddleware(EnsureDashboardPermission::class);

    $user = User::factory()->create();
    $page = Page::query()->create([
        'title' => 'Old page',
        'slug' => 'old-page',
        'status' => 'draft',
        'created_by' => $user->id,
        'updated_by' => $user->id,
    ]);

    Block::query()->create([
        'page_id' => $page->id,
        'type' => 'heading',
        'props' => ['text' => 'Old heading'],
        'styles' => [],
        'order' => 0,
    ]);

    $blocks = nestedPageBlocks();
    $blocks[0]['children'][0]['children'][0]['data']['text'] = 'Updated heading';

    $response = $this->actingAs($user)->put(route('pages.update', $page), [
        'title' => 'Updated page',
        'slug' => 'updated-page',
        'status' => 'publish',
        'blocks' => json_encode($blocks),
    ]);

    $response->assertRedirect(route('pages.index'));

    $page->refresh();

    expect($page->title)->toBe('Updated page')
        ->and($page->slug)->toBe('updated-page')
        ->and($page->status)->toBe('publish')
        ->and($page->published_at)->not->toBeNull()
        ->and($page->blocks)->toHaveCount(4)
        ->and(Block::query()->where('page_id', $page->id)->where('props->text', 'Old heading')->exists())->toBeFalse();
});

test('it stores page field and block translations', function () {
    $this->withoutMiddleware(EnsureDashboardPermission::class);

    $user = User::factory()->create();
    $language = Language::query()->create([
        'code' => 'id',
        'english_name' => 'Indonesian',
        'active' => 1,
    ]);
    $page = Page::query()->create([
        'title' => 'About Us',
        'slug' => 'about-us',
        'status' => 'publish',
        'created_by' => $user->id,
        'updated_by' => $user->id,
    ]);
    $block = Block::query()->create([
        'page_id' => $page->id,
        'type' => 'heading',
        'props' => ['text' => 'About Us', 'level' => 'h1'],
        'styles' => [],
        'order' => 0,
    ]);

    $response = $this->actingAs($user)->put(route('dashboard.cms.pages.translations.update', [
        'page' => $page->id,
        'language' => $language->id,
    ]), [
        'title' => 'Tentang Kami',
        'slug' => 'tentang-kami',
        'excerpt' => 'Tentang Gita Trading',
        'content' => 'Konten halaman',
        'status' => 'publish',
        'seo_title' => 'Tentang SEO',
        'blocks' => [
            [
                'block_id' => $block->id,
                'translations' => [
                    'text' => 'Tentang Kami',
                ],
            ],
        ],
    ]);

    $response->assertRedirect();

    $translation = PageTranslation::query()
        ->where('page_id', $page->id)
        ->where('language_id', $language->id)
        ->firstOrFail();
    $blockTranslation = BlockTranslation::query()
        ->where('block_id', $block->id)
        ->where('language_id', $language->id)
        ->firstOrFail();

    expect($translation->title)->toBe('Tentang Kami')
        ->and($translation->slug)->toBe('tentang-kami')
        ->and($translation->seo_title)->toBe('Tentang SEO')
        ->and($blockTranslation->props)->toBe(['text' => 'Tentang Kami', 'level' => 'h1']);
});
