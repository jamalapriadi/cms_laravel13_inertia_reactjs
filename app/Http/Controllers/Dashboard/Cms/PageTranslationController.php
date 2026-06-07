<?php

namespace App\Http\Controllers\Dashboard\Cms;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\Cms\UpdatePageTranslationRequest;
use App\Models\BlockTranslation;
use App\Models\Dashboard\Language;
use App\Models\Page;
use App\Models\PageTranslation;
use App\Services\Cms\BlockTextExtractor;
use App\Services\Cms\LanguageManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PageTranslationController extends Controller
{
    public function index(Page $page, LanguageManager $languageManager)
    {
        $languages = $languageManager->getEnabledLanguages();
        $fallbackLanguage = $languageManager->getDefaultLanguage();

        $target = $languages
            ->first(fn (Language $language) => $language->id !== $fallbackLanguage?->id)
            ?? $fallbackLanguage
            ?? $languages->first();

        if (! $target) {
            return redirect()->route('pages.index')
                ->with('error', 'No active language is configured.');
        }

        return redirect()->route('dashboard.cms.pages.translations.edit', [
            'page' => $page->id,
            'language' => $target->id,
        ]);
    }

    public function edit(
        Page $page,
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

        $page->load([
            'translations',
            'blocks' => fn ($query) => $query->orderBy('order'),
            'blocks.translations' => fn ($query) => $query->where('language_id', $language->id),
        ]);

        $pageTranslation = $page->translations
            ->firstWhere('language_id', $language->id);

        $translationStatuses = $languageOptions->map(function (Language $enabledLanguage) use ($page) {
            return [
                'id' => $enabledLanguage->id,
                'code' => strtolower((string) $enabledLanguage->code),
                'name' => $enabledLanguage->english_name,
                'translated' => $page->translations
                    ->contains('language_id', $enabledLanguage->id),
            ];
        })->values();

        $blocks = $page->blocks->map(function ($block) use ($extractor, $language) {
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

        return Inertia::render('Dashboard/Cms/PageTranslations/Edit', [
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'excerpt' => $page->excerpt,
                'content' => $page->content,
                'status' => $page->status,
                'seo_title' => $page->seo_title,
                'seo_description' => $page->seo_description,
                'seo_keywords' => $page->seo_keywords,
                'published_at' => $page->published_at?->toIso8601String(),
            ],
            'pageTranslation' => [
                'title' => $pageTranslation?->title ?? '',
                'slug' => $pageTranslation?->slug ?? Str::slug($page->title),
                'excerpt' => $pageTranslation?->excerpt ?? '',
                'content' => $pageTranslation?->content ?? '',
                'status' => $pageTranslation?->status ?? 'draft',
                'seo_title' => $pageTranslation?->seo_title ?? '',
                'seo_description' => $pageTranslation?->seo_description ?? '',
                'seo_keywords' => $pageTranslation?->seo_keywords ?? '',
                'published_at' => $pageTranslation?->published_at?->toIso8601String(),
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
            'translationExists' => (bool) $pageTranslation,
            'blocks' => $blocks,
        ]);
    }

    public function update(
        UpdatePageTranslationRequest $request,
        Page $page,
        Language $language,
        BlockTextExtractor $extractor
    ) {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $page, $language, $extractor) {
            $pageTranslation = PageTranslation::query()->updateOrCreate(
                [
                    'page_id' => $page->id,
                    'language_id' => $language->id,
                ],
                [
                    'title' => $validated['title'],
                    'slug' => $validated['slug'],
                    'excerpt' => $validated['excerpt'] ?? null,
                    'content' => $validated['content'] ?? null,
                    'status' => $validated['status'],
                    'seo_title' => $validated['seo_title'] ?? null,
                    'seo_description' => $validated['seo_description'] ?? null,
                    'seo_keywords' => $validated['seo_keywords'] ?? null,
                    'published_at' => $validated['published_at'] ?? null,
                ]
            );

            $pageBlocks = $page->blocks()->get()->keyBy('id');

            foreach ($validated['blocks'] ?? [] as $blockPayload) {
                $block = $pageBlocks->get((int) $blockPayload['block_id']);

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

            return $pageTranslation;
        });

        return redirect()->back()
            ->with('success', 'Page translation saved successfully.');
    }
}
