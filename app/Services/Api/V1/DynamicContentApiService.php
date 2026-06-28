<?php

namespace App\Services\Api\V1;

use App\Models\ContentEntry;
use App\Models\ContentType;
use App\Models\Dashboard\Media;
use App\Services\DynamicContent\DynamicContentFieldService;
use App\Support\MediaPath;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class DynamicContentApiService
{
    public function __construct(
        private readonly DynamicContentFieldService $dynamicContentFieldService
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
    public function paginatePublishedEntries(ContentType $contentType, array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 10);
        $fields = $this->dynamicContentFieldService->activeFieldsForContentType($contentType)->keyBy('name');

        $query = ContentEntry::query()
            ->where('content_type_id', $contentType->id)
            ->published()
            ->with('translations.language')
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('excerpt', 'like', "%{$search}%")
                        ->orWhere('data', 'like', "%{$search}%");
                });
            })
            ->when(array_key_exists('is_featured', $filters) && $filters['is_featured'] !== null && $fields->has('is_featured'), function (Builder $query) use ($filters): void {
                $query->where('data->is_featured', (bool) $filters['is_featured']);
            })
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
                function (Builder $query) use ($filters): void {
                    $provinceSlug = $filters['province'];
                    $provinceEntry = ContentEntry::query()
                        ->whereHas('contentType', fn ($q) => $q->where('slug', 'provinces'))
                        ->where(function (Builder $q) use ($provinceSlug): void {
                            $q->where('slug', $provinceSlug)
                                ->orWhereHas('translations', function (Builder $tq) use ($provinceSlug): void {
                                    $tq->where('slug', $provinceSlug)
                                        ->where('status', 'published');
                                });
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

        $this->hydrateEntries($paginator->getCollection(), $contentType);

        return $paginator;
    }

    public function findPublishedEntry(ContentType $contentType, string $entrySlug, ?string $locale = null): ?ContentEntry
    {
        $entry = ContentEntry::query()
            ->where('content_type_id', $contentType->id)
            ->published()
            ->with('translations.language')
            ->where('slug', $entrySlug)
            ->first();

        if (! $entry) {
            return null;
        }

        $this->hydrateEntries(collect([$entry]), $contentType);

        return $entry;
    }

    /**
     * @param  Collection<int, ContentEntry>  $entries
     */
    private function hydrateEntries(Collection $entries, ContentType $contentType): void
    {
        $fieldDefinitions = $this->dynamicContentFieldService
            ->activeFieldsForContentType($contentType)
            ->keyBy('name')
            ->all();

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

        $records = Media::query()
            ->where('disk', 'public')
            ->whereIn('path', $paths->all())
            ->get()
            ->keyBy('path');

        return $paths
            ->mapWithKeys(function (string $path) use ($records): array {
                /** @var Media|null $media */
                $media = $records->get($path);

                return [
                    $path => [
                        'id' => $media?->id,
                        'url' => $media?->url ?? MediaPath::url($path),
                        'alt_text' => $media?->alt,
                        'filename' => $media?->file_name ?? basename($path),
                        'mime_type' => $media?->mime_type,
                    ],
                ];
            })
            ->all();
    }
}
