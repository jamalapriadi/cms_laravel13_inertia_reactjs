<?php

namespace Jamalapriadi\DynamicContentBuilder\Services\Api;

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
        private readonly \App\Services\ActiveLanguageService $activeLanguageService,
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

        $activeLanguages = $this->activeLanguageService->activeLanguages();
        $localeCode = $this->activeLanguageService->resolveLocale($requestedLocale);
        $fallbackCode = $this->activeLanguageService->defaultCode();

        $localeLanguage = $activeLanguages->firstWhere('code', $localeCode);
        $fallbackLanguage = $activeLanguages->firstWhere('code', $fallbackCode);

        $languageIds = array_filter([$localeLanguage?->id, $fallbackLanguage?->id]);

        $query = ContentEntry::query()
            ->with(['translations' => function ($query) use ($languageIds): void {
                if ($languageIds !== []) {
                    $query->whereIn('language_id', array_unique($languageIds));
                } else {
                    $query->whereRaw('1 = 0');
                }
            }])
            ->where('content_type_id', $contentType->id)
            ->published()
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('excerpt', 'like', "%{$search}%")
                        ->orWhere('data', 'like', "%{$search}%");
                });
            })
            ->when(
                array_key_exists('is_featured', $filters)
                    && $filters['is_featured'] !== null
                    && $fields->has('is_featured'),
                fn (Builder $query) => $query->where('data->is_featured', (bool) $filters['is_featured']),
            );

        $sort = (string) ($filters['sort'] ?? '');
        $order = strtolower((string) ($filters['order'] ?? 'asc')) === 'desc' ? 'desc' : 'asc';

        if ($sort !== '' && in_array($sort, ['title', 'published_at', 'sort_order', 'created_at'], true)) {
            $query->orderBy($sort, $order)->orderBy('id');
        } else {
            $query->orderBy('sort_order')->orderByDesc('published_at')->orderByDesc('created_at');
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        $this->hydrateEntries($paginator->getCollection(), $contentType, $localeLanguage?->id, $fallbackLanguage?->id);

        return $paginator;
    }

    public function findPublishedEntry(ContentType $contentType, string $entrySlug, ?string $requestedLocale = null): ?ContentEntry
    {
        $activeLanguages = $this->activeLanguageService->activeLanguages();
        $localeCode = $this->activeLanguageService->resolveLocale($requestedLocale);
        $fallbackCode = $this->activeLanguageService->defaultCode();

        $localeLanguage = $activeLanguages->firstWhere('code', $localeCode);
        $fallbackLanguage = $activeLanguages->firstWhere('code', $fallbackCode);

        $languageIds = array_filter([$localeLanguage?->id, $fallbackLanguage?->id]);

        $entry = ContentEntry::query()
            ->with(['translations' => function ($query) use ($languageIds): void {
                if ($languageIds !== []) {
                    $query->whereIn('language_id', array_unique($languageIds));
                } else {
                    $query->whereRaw('1 = 0');
                }
            }])
            ->where('content_type_id', $contentType->id)
            ->published()
            ->where('slug', $entrySlug)
            ->first();

        if (! $entry) {
            return null;
        }

        $this->hydrateEntries(collect([$entry]), $contentType, $localeLanguage?->id, $fallbackLanguage?->id);

        return $entry;
    }

    /**
     * @param  Collection<int, ContentEntry>  $entries
     */
    private function hydrateEntries(Collection $entries, ContentType $contentType, ?int $localeLanguageId = null, ?int $fallbackLanguageId = null): void
    {
        $fieldDefinitions = $this->dynamicContentFieldService
            ->activeFieldsForContentType($contentType)
            ->keyBy('name')
            ->all();

        $mediaMap = $this->mediaPayloadMap($entries, $fieldDefinitions);

        $entries->each(function (ContentEntry $entry) use ($contentType, $fieldDefinitions, $mediaMap, $localeLanguageId, $fallbackLanguageId): void {
            if ($localeLanguageId) {
                $entry->resolveTranslation($localeLanguageId, $fallbackLanguageId);
            }
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
                $items = [];

                foreach ($fieldDefinitions as $name => $field) {
                    if (! in_array($field->type, ['image', 'gallery', 'file'], true)) {
                        continue;
                    }

                    $value = $entry->data[$name] ?? null;

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
}
