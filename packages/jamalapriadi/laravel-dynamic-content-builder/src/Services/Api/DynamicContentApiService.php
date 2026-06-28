<?php

namespace Jamalapriadi\DynamicContentBuilder\Services\Api;

use App\Models\ContentEntryTranslation;
use App\Models\Dashboard\Language;
use App\Services\Cms\LanguageManager;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Jamalapriadi\DynamicContentBuilder\Models\ContentEntry;
use Jamalapriadi\DynamicContentBuilder\Models\ContentType;
use Jamalapriadi\DynamicContentBuilder\Services\DynamicContentFieldService;
use Jamalapriadi\DynamicContentBuilder\Support\MediaPath;

class DynamicContentApiService
{
    public function __construct(
        private readonly DynamicContentFieldService $dynamicContentFieldService,
        private readonly LanguageManager $languageManager,
    ) {}

    /**
     * @return Collection<int, ContentType>
     */
    public function listActiveContentTypes(): Collection
    {
        return ContentType::query()
            ->active()
            ->with([
                'fieldGroups' => fn ($query) => $query
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->with([
                        'fields' => fn ($query) => $query
                            ->where('is_active', true)
                            ->orderBy('sort_order'),
                    ]),
            ])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    public function findActiveContentType(string $slug): ?ContentType
    {
        return ContentType::query()
            ->active()
            ->where('slug', $slug)
            ->first();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, ContentEntry>
     */
    public function paginatePublishedEntries(ContentType $contentType, array $filters, ?string $requestedLocale = null): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 10);
        $fields = $this->dynamicContentFieldService->activeFieldsForContentType($contentType)->keyBy('name');
        $language = filled($requestedLocale) ? $this->resolveLanguage($requestedLocale) : null;
        $fallbackLanguage = $language ? $this->defaultLanguage() : null;

        $query = ContentEntry::query()
            ->where('content_type_id', $contentType->id)
            ->published()
            ->with([
                'translations' => fn ($query) => $this->constrainTranslations($query, $language, $fallbackLanguage),
                'translations.language',
            ])
            ->when($filters['search'] ?? null, function (Builder $query, string $search) use ($language): void {
                $this->applySearch($query, $search, $language);
            })
            ->when(
                array_key_exists('is_featured', $filters)
                    && $filters['is_featured'] !== null
                    && $fields->has('is_featured'),
                fn (Builder $query) => $query->where('data->is_featured', (bool) $filters['is_featured']),
            )
            ->when(
                filled($filters['province_id'] ?? null),
                function (Builder $query) use ($filters): void {
                    $provinceId = $filters['province_id'];
                    $query->where(function (Builder $q) use ($provinceId): void {
                        $q->where('data->province', $provinceId)
                            ->orWhere('data->province_id', $provinceId);
                    });
                }
            )
            ->when(
                ! filled($filters['province_id'] ?? null) && filled($filters['province'] ?? null),
                function (Builder $query) use ($filters, $language): void {
                    $provinceSlug = $filters['province'];
                    $provinceEntry = ContentEntry::query()
                        ->whereHas('contentType', fn ($q) => $q->where('slug', 'provinces'))
                        ->where(function (Builder $q) use ($provinceSlug, $language): void {
                            $q->where('slug', $provinceSlug);
                            if ($language) {
                                $q->orWhereHas('translations', function (Builder $tq) use ($provinceSlug, $language): void {
                                    $tq->where('slug', $provinceSlug)
                                        ->where('language_id', $language->id)
                                        ->where('status', 'published');
                                });
                            }
                        })
                        ->published()
                        ->first();

                    if (! $provinceEntry) {
                        $query->whereRaw('1 = 0');
                    } else {
                        $query->where(function (Builder $q) use ($provinceEntry): void {
                            $q->where('data->province', $provinceEntry->id)
                                ->orWhere('data->province_id', $provinceEntry->id);
                        });
                    }
                }
            );

        $sort = (string) ($filters['sort'] ?? '');
        $order = strtolower((string) ($filters['order'] ?? 'asc')) === 'desc' ? 'desc' : 'asc';

        if ($sort !== '' && in_array($sort, ['title', 'published_at', 'sort_order', 'created_at'], true)) {
            $query->orderBy($sort, $order)->orderBy('id');
        } else {
            $query->orderBy('sort_order')->orderByDesc('published_at')->orderByDesc('created_at');
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        $this->hydrateEntries($paginator->getCollection(), $contentType, $language, $fallbackLanguage);

        return $paginator;
    }

    public function findPublishedEntry(ContentType $contentType, string $entrySlug, ?string $requestedLocale = null): ?ContentEntry
    {
        $language = filled($requestedLocale) ? $this->resolveLanguage($requestedLocale) : null;
        $fallbackLanguage = $language ? $this->defaultLanguage() : null;

        $entry = ContentEntry::query()
            ->where('content_type_id', $contentType->id)
            ->published()
            ->with([
                'translations' => fn ($query) => $this->constrainTranslations($query, $language, $fallbackLanguage),
                'translations.language',
            ])
            ->where(function (Builder $query) use ($entrySlug, $language): void {
                $query->where('slug', $entrySlug);

                if (! $language) {
                    return;
                }

                $query->orWhereHas('translations', function (Builder $translationQuery) use ($entrySlug, $language): void {
                    $translationQuery->where('slug', $entrySlug)
                        ->where('language_id', $language->id);

                    $this->applyPublishedTranslation($translationQuery);
                });
            })
            ->first();

        if (! $entry) {
            return null;
        }

        $this->hydrateEntries(collect([$entry]), $contentType, $language, $fallbackLanguage);

        return $entry;
    }

    /**
     * @param  Collection<int, ContentEntry>  $entries
     */
    private function hydrateEntries(Collection $entries, ContentType $contentType, ?Language $language = null, ?Language $fallbackLanguage = null): void
    {
        $fieldDefinitions = $this->dynamicContentFieldService
            ->activeFieldsForContentType($contentType)
            ->keyBy('name')
            ->all();

        $entries->each(function (ContentEntry $entry) use ($language, $fallbackLanguage): void {
            $translation = $this->resolvePublishedTranslation($entry, $language, $fallbackLanguage);

            $entry->setRelation('apiResolvedTranslation', $translation);
            $entry->setAttribute('api_language', $this->languagePayload($language));
            $entry->setAttribute('api_resolved_data', $this->resolvedFieldData($entry, $translation));
        });

        $mediaMap = $this->mediaPayloadMap($entries, $fieldDefinitions);

        $entries->each(function (ContentEntry $entry) use ($contentType, $fieldDefinitions, $mediaMap): void {
            $entry->setRelation('contentType', $contentType);
            $entry->setAttribute('api_field_definitions', $fieldDefinitions);
            $entry->setAttribute('api_media_map', $mediaMap);
        });
    }

    /**
     * @param  array<string, mixed>  $fieldDefinitions
     * @return array<string, array<string, mixed>>
     */
    private function mediaPayloadMap(Collection $entries, array $fieldDefinitions): array
    {
        $paths = $entries
            ->flatMap(function (ContentEntry $entry) use ($fieldDefinitions): array {
                $resolvedData = $entry->getAttribute('api_resolved_data');
                $items = [];

                foreach ($fieldDefinitions as $name => $field) {
                    if (! in_array($field->type, ['image', 'gallery', 'file'], true)) {
                        continue;
                    }

                    $value = is_array($resolvedData)
                        ? ($resolvedData[$name] ?? null)
                        : ($entry->data[$name] ?? null);

                    if ($field->type === 'gallery') {
                        foreach ((array) $value as $path) {
                            if (is_string($path) && $path !== '') {
                                $items[] = $path;
                            }
                        }

                        continue;
                    }

                    if (is_string($value) && $value !== '') {
                        $items[] = $value;
                    }
                }

                return $items;
            })
            ->filter()
            ->unique()
            ->values();

        if ($paths->isEmpty()) {
            return [];
        }

        $records = $this->configuredMediaRecords($paths->all());

        return $paths
            ->mapWithKeys(function (string $path) use ($records): array {
                /** @var Model|null $media */
                $media = $records->get($path);

                return [
                    $path => [
                        'id' => $media?->getKey(),
                        'url' => $this->mediaUrl($media, $path),
                        'alt_text' => $media ? data_get($media, $this->mediaColumn('alt')) : null,
                        'filename' => $media
                            ? data_get($media, $this->mediaColumn('file_name'), basename($path))
                            : basename($path),
                        'mime_type' => $media ? data_get($media, $this->mediaColumn('mime_type')) : null,
                    ],
                ];
            })
            ->all();
    }

    /**
     * @param  list<string>  $paths
     * @return Collection<int|string, Model>
     */
    private function configuredMediaRecords(array $paths): Collection
    {
        $modelClass = config('dynamic-content-builder.media.metadata_model');

        if (! is_string($modelClass) || $modelClass === '' || ! class_exists($modelClass)) {
            return collect();
        }

        if (! is_subclass_of($modelClass, Model::class)) {
            return collect();
        }

        /** @var Model $mediaModel */
        $mediaModel = new $modelClass;

        $pathColumn = $this->mediaColumn('path');
        $diskColumn = $this->mediaColumn('disk');
        $disk = (string) config('dynamic-content-builder.media.disk', 'public');

        return $mediaModel::query()
            ->where($diskColumn, $disk)
            ->whereIn($pathColumn, $paths)
            ->get()
            ->keyBy($pathColumn);
    }

    private function mediaColumn(string $key): string
    {
        return (string) config("dynamic-content-builder.media.metadata_columns.{$key}", $key);
    }

    private function mediaUrl(?Model $media, string $path): ?string
    {
        if ($media) {
            $accessor = config('dynamic-content-builder.media.metadata_columns.url_accessor');

            if (is_string($accessor) && $accessor !== '') {
                $url = data_get($media, $accessor);

                if (is_string($url) && $url !== '') {
                    return $url;
                }
            }
        }

        return MediaPath::url($path);
    }

    private function resolveLanguage(?string $locale): ?Language
    {
        return $this->languageManager->resolveLanguageByLocale($locale);
    }

    private function defaultLanguage(): ?Language
    {
        return $this->languageManager->getDefaultLanguage();
    }

    private function constrainTranslations($query, ?Language $language, ?Language $fallbackLanguage): void
    {
        $languageIds = collect([$language?->id, $fallbackLanguage?->id])
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($languageIds === []) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->whereIn('language_id', $languageIds);
    }

    private function applySearch(Builder $query, string $search, ?Language $language): void
    {
        $query->where(function (Builder $searchQuery) use ($search, $language): void {
            $searchQuery
                ->where('title', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
                ->orWhere('excerpt', 'like', "%{$search}%")
                ->orWhere('data', 'like', "%{$search}%")
                ->orWhereHas('translations', function (Builder $translationQuery) use ($search, $language): void {
                    if ($language) {
                        $translationQuery->where('language_id', $language->id);
                    }

                    $translationQuery->where(function (Builder $nestedQuery) use ($search): void {
                        $nestedQuery
                            ->where('title', 'like', "%{$search}%")
                            ->orWhere('slug', 'like', "%{$search}%")
                            ->orWhere('excerpt', 'like', "%{$search}%")
                            ->orWhere('data', 'like', "%{$search}%");
                    });
                });
        });
    }

    private function applyPublishedTranslation(Builder $query): void
    {
        $query
            ->where('status', 'published')
            ->where(function (Builder $publishedQuery): void {
                $publishedQuery->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            });
    }

    private function resolvePublishedTranslation(ContentEntry $entry, ?Language $language, ?Language $fallbackLanguage): ?ContentEntryTranslation
    {
        foreach ([$language, $fallbackLanguage] as $candidateLanguage) {
            if (! $candidateLanguage) {
                continue;
            }

            $translation = $entry->translationForLanguage($candidateLanguage->id);

            if ($translation && $this->translationIsPublished($translation)) {
                return $translation;
            }
        }

        return null;
    }

    private function translationIsPublished(ContentEntryTranslation $translation): bool
    {
        return $translation->status === 'published'
            && ($translation->published_at === null || $translation->published_at->lte(now()));
    }

    /**
     * @return array<string, mixed>
     */
    private function resolvedFieldData(ContentEntry $entry, ?ContentEntryTranslation $translation): array
    {
        $resolvedData = is_array($entry->data) ? $entry->data : [];

        if (! $translation || ! is_array($translation->data)) {
            return $resolvedData;
        }

        foreach ($translation->data as $key => $value) {
            $resolvedData[$key] = array_key_exists($key, $resolvedData)
                ? $this->mergeTranslatedValue($resolvedData[$key], $value)
                : (blank($value) ? null : $value);
        }

        return collect($resolvedData)
            ->reject(fn (mixed $value) => $value === null)
            ->all();
    }

    private function mergeTranslatedValue(mixed $original, mixed $translated): mixed
    {
        if (blank($translated)) {
            return $original;
        }

        if (! is_array($original) || ! is_array($translated)) {
            return $translated;
        }

        if (array_is_list($original) || array_is_list($translated)) {
            return $translated === [] ? $original : $translated;
        }

        $merged = $original;

        foreach ($translated as $key => $value) {
            if (array_key_exists($key, $merged)) {
                $merged[$key] = $this->mergeTranslatedValue($merged[$key], $value);

                continue;
            }

            if (! blank($value)) {
                $merged[$key] = $value;
            }
        }

        return $merged;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function languagePayload(?Language $language): ?array
    {
        if (! $language) {
            return null;
        }

        return [
            'id' => $language->id,
            'code' => strtolower((string) $language->code),
            'name' => $language->english_name,
        ];
    }
}
