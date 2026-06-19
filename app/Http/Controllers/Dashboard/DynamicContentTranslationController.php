<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\DynamicContent\UpdateContentTranslationRequest;
use App\Models\ContentEntry;
use App\Models\ContentEntryTranslation;
use App\Models\ContentType;
use App\Models\Dashboard\Language;
use App\Services\Cms\LanguageManager;
use App\Services\DynamicContent\DynamicContentFieldService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DynamicContentTranslationController extends Controller
{
    public function index(ContentType $contentType, ContentEntry $contentEntry, LanguageManager $languageManager)
    {
        $languages = $languageManager->getEnabledLanguages();
        $fallbackLanguage = $languageManager->getDefaultLanguage();

        $target = $languages
            ->first(fn (Language $language) => $language->id !== $fallbackLanguage?->id)
            ?? $fallbackLanguage
            ?? $languages->first();

        if (! $target) {
            return redirect()->route('dynamic-content.index', ['contentType' => $contentType->slug])
                ->with('error', 'No active language is configured.');
        }

        return redirect()->route('dynamic-content.translations.edit', [
            'contentType' => $contentType->slug,
            'contentEntry' => $contentEntry->id,
            'language' => $target->id,
        ]);
    }

    public function edit(
        ContentType $contentType,
        ContentEntry $contentEntry,
        Language $language,
        LanguageManager $languageManager,
        DynamicContentFieldService $fieldService
    ): Response {
        $defaultLanguage = $languageManager->getDefaultLanguage();
        $enabledLanguages = $languageManager->getEnabledLanguages();
        $languageOptions = $enabledLanguages
            ->prepend($language)
            ->unique('id')
            ->values();

        $contentEntry->load('translations');

        $translation = $contentEntry->translations
            ->firstWhere('language_id', $language->id);

        $translationStatuses = $languageOptions->map(function (Language $enabledLanguage) use ($contentEntry) {
            return [
                'id' => $enabledLanguage->id,
                'code' => strtolower((string) $enabledLanguage->code),
                'name' => $enabledLanguage->english_name,
                'translated' => $contentEntry->translations
                    ->contains('language_id', $enabledLanguage->id),
            ];
        })->values();

        // Pass entry's original data to field service to get original structure
        $fieldGroups = $fieldService->schemaForContentType($contentType, $contentEntry->data ?? []);

        return Inertia::render('Dashboard/DynamicContentTranslations/Edit', [
            'contentType' => [
                'id' => $contentType->id,
                'name' => $contentType->name,
                'slug' => $contentType->slug,
            ],
            'contentEntry' => [
                'id' => $contentEntry->id,
                'title' => $contentEntry->title,
                'slug' => $contentEntry->slug,
                'excerpt' => $contentEntry->excerpt,
                'status' => $contentEntry->status,
                'published_at' => $contentEntry->published_at?->toIso8601String(),
                'data' => $contentEntry->data ?? [],
            ],
            'translation' => [
                'title' => $translation?->title ?? '',
                'slug' => $translation?->slug ?? Str::slug($contentEntry->title),
                'excerpt' => $translation?->excerpt ?? '',
                'status' => $translation?->status ?? 'draft',
                'published_at' => $translation?->published_at?->toIso8601String(),
                'data' => $translation?->data ?? [],
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
            'translationExists' => (bool) $translation,
            'fieldGroups' => $fieldGroups,
        ]);
    }

    public function update(
        UpdateContentTranslationRequest $request,
        ContentType $contentType,
        ContentEntry $contentEntry,
        Language $language,
        DynamicContentFieldService $fieldService
    ) {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $contentEntry, $language, $fieldService, $contentType) {
            // Process translated fields according to field types
            $fields = $fieldService->activeFieldsForContentType($contentType)->keyBy('name');
            $originalData = $contentEntry->data ?? [];
            $translatedData = $validated['data'] ?? [];

            $finalTranslatedData = [];

            foreach ($fields as $fieldName => $field) {
                // If a translation is provided for this field, normalize it and store it
                // Otherwise, we do not store it so it falls back to original at display time.
                // Or maybe we store everything? Let's store only what's provided.
                if (array_key_exists($fieldName, $translatedData)) {
                    $finalTranslatedData[$fieldName] = $fieldService->normalizeValue($field, $translatedData[$fieldName]);
                }
            }

            ContentEntryTranslation::query()->updateOrCreate(
                [
                    'content_entry_id' => $contentEntry->id,
                    'language_id' => $language->id,
                ],
                [
                    'title' => $validated['title'],
                    'slug' => $validated['slug'],
                    'excerpt' => $validated['excerpt'] ?? null,
                    'status' => $validated['status'],
                    'published_at' => $validated['published_at'] ?? null,
                    'data' => $finalTranslatedData,
                ]
            );
        });

        return redirect()->back()
            ->with('success', 'Translation saved successfully.');
    }
}
