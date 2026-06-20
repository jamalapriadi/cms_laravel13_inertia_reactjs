<?php

namespace App\Http\Controllers\Dashboard\Cms;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\Cms\UpdatePostTranslationRequest;
use App\Models\BlockTranslation;
use App\Models\Dashboard\Language;
use App\Models\Post;
use App\Models\PostTranslation;
use App\Services\Cms\BlockTextExtractor;
use App\Services\Cms\LanguageManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PostTranslationController extends Controller
{
    public function index(Post $post, LanguageManager $languageManager)
    {
        $languages = $languageManager->getEnabledLanguages();
        $fallbackLanguage = $languageManager->getDefaultLanguage();

        $target = $languages
            ->first(fn (Language $language) => $language->id !== $fallbackLanguage?->id)
            ?? $fallbackLanguage
            ?? $languages->first();

        if (! $target) {
            return redirect()->route('posts.index')
                ->with('error', 'No active language is configured.');
        }

        return redirect()->route('dashboard.cms.posts.translations.edit', [
            'post' => $post->id,
            'language' => $target->id,
        ]);
    }

    public function edit(
        Post $post,
        Language $language,
        LanguageManager $languageManager,
        BlockTextExtractor $extractor
    ): Response {
        $defaultLanguage = $languageManager->getDefaultLanguage();
        $enabledLanguages = $languageManager->getEnabledLanguages();
        $languageOptions = $enabledLanguages
            ->prepend($language)
            ->unique('id')
            ->values();

        $post->load([
            'translations',
            'blocks' => fn ($query) => $query->orderBy('order'),
            'blocks.translations' => fn ($query) => $query->where('language_id', $language->id),
        ]);

        $postTranslation = $post->translations
            ->firstWhere('language_id', $language->id);

        $translationStatuses = $languageOptions->map(function (Language $enabledLanguage) use ($post) {
            return [
                'id' => $enabledLanguage->id,
                'code' => strtolower((string) $enabledLanguage->code),
                'name' => $enabledLanguage->english_name,
                'translated' => $post->translations
                    ->contains('language_id', $enabledLanguage->id),
            ];
        })->values();

        $blocks = $post->blocks->map(function ($block) use ($extractor, $language) {
            $originalProps = is_array($block->props) ? $block->props : [];
            $sourceTexts = $extractor->extractTranslatableTexts($originalProps);

            $existingTranslation = $block->translations->firstWhere('language_id', $language->id);
            $translatedProps = is_array($existingTranslation?->props) ? $existingTranslation->props : [];
            $translatedTexts = $extractor->extractTranslatableTexts($translatedProps);

            $textItems = collect($sourceTexts)
                ->map(fn (string $value, string $path) => [
                    'path' => $path,
                    'original' => $value,
                    'translated' => $translatedTexts[$path] ?? '',
                ])
                ->values()
                ->all();

            return [
                'id' => $block->id,
                'parent_id' => $block->parent_id,
                'type' => $block->type,
                'order' => $block->order,
                'text_items' => $textItems,
            ];
        })->values()->all();

        return Inertia::render('Dashboard/Cms/PostTranslations/Edit', [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'excerpt' => $post->excerpt,
                'content' => $post->content,
                'status' => $post->status,
                'published_at' => $post->published_at?->toIso8601String(),
            ],
            'postTranslation' => [
                'title' => $postTranslation?->title ?? '',
                'slug' => $postTranslation?->slug ?? Str::slug($post->title),
                'excerpt' => $postTranslation?->excerpt ?? '',
                'content' => $postTranslation?->content ?? '',
                'status' => $postTranslation?->status ?? 'draft',
                'published_at' => $postTranslation?->published_at?->toIso8601String(),
            ],
            'language' => [
                'id' => $language->id,
                'code' => strtolower((string) $language->code),
                'name' => $language->english_name,
            ],
            'defaultLanguage' => $defaultLanguage ? [
                'id' => $defaultLanguage->id,
                'code' => strtolower((string) $defaultLanguage->code),
                'name' => $defaultLanguage->english_name,
            ] : null,
            'languages' => $languageOptions->map(fn (Language $enabledLanguage) => [
                'id' => $enabledLanguage->id,
                'code' => strtolower((string) $enabledLanguage->code),
                'name' => $enabledLanguage->english_name,
            ])->values()->all(),
            'translationStatuses' => $translationStatuses,
            'translationExists' => (bool) $postTranslation,
            'blocks' => $blocks,
        ]);
    }

    public function update(
        UpdatePostTranslationRequest $request,
        Post $post,
        Language $language,
        BlockTextExtractor $extractor
    ) {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $post, $language, $extractor) {
            $postTranslation = PostTranslation::query()->updateOrCreate(
                [
                    'post_id' => $post->id,
                    'language_id' => $language->id,
                ],
                [
                    'title' => $validated['title'],
                    'slug' => $validated['slug'],
                    'excerpt' => $validated['excerpt'] ?? null,
                    'content' => $validated['content'] ?? null,
                    'status' => $validated['status'],
                    'published_at' => $validated['published_at'] ?? null,
                ]
            );

            $postBlocks = $post->blocks()->get()->keyBy('id');

            foreach ($validated['blocks'] ?? [] as $blockPayload) {
                $block = $postBlocks->get((int) $blockPayload['block_id']);

                if (! $block) {
                    continue;
                }

                $originalProps = is_array($block->props) ? $block->props : [];
                $availablePaths = array_keys($extractor->extractTranslatableTexts($originalProps));
                $translations = collect($blockPayload['translations'] ?? [])
                    ->filter(fn ($value, $path) => in_array((string) $path, $availablePaths, true))
                    ->map(fn ($value) => is_string($value) ? trim($value) : '')
                    ->filter(fn (string $value) => $value !== '')
                    ->all();

                if ($translations === []) {
                    BlockTranslation::query()
                        ->where('block_id', $block->id)
                        ->where('language_id', $language->id)
                        ->delete();

                    continue;
                }

                $translatedProps = $extractor->applyTranslations($originalProps, $translations);

                BlockTranslation::query()->updateOrCreate(
                    [
                        'block_id' => $block->id,
                        'language_id' => $language->id,
                    ],
                    [
                        'props' => $translatedProps,
                    ]
                );
            }

            return $postTranslation;
        });

        return redirect()->back()
            ->with('success', 'Post translation saved successfully.');
    }
}
