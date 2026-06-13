<?php

namespace Jamalapriadi\DynamicContentBuilder\Services;

use Jamalapriadi\DynamicContentBuilder\Models\ContentEntry;
use Jamalapriadi\DynamicContentBuilder\Models\ContentType;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ContentEntryService
{
    public function __construct(
        private readonly DynamicContentFieldService $dynamicContentFieldService
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, ContentEntry>
     */
    public function paginateForDashboard(ContentType $contentType, array $filters): LengthAwarePaginator
    {
        $query = $contentType->entries()
            ->with(['creator:id,name', 'updater:id,name'])
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('excerpt', 'like', "%{$search}%")
                        ->orWhere('data', 'like', "%{$search}%");
                });
            })
            ->when(($filters['status'] ?? null) && $filters['status'] !== 'all', fn (Builder $query) => $query->where('status', $filters['status']))
            ->orderBy('sort_order')
            ->latest('published_at')
            ->latest('created_at');

        return $query->paginate(10)->withQueryString();
    }

    public function create(ContentType $contentType, array $data, ?int $userId): ContentEntry
    {
        return DB::transaction(function () use ($contentType, $data, $userId): ContentEntry {
            return ContentEntry::query()->create([
                'content_type_id' => $contentType->id,
                'title' => $data['title'],
                'slug' => $this->uniqueSlug($contentType, $data['slug'] ?? null, $data['title']),
                'excerpt' => $data['excerpt'] ?? null,
                'status' => $data['status'],
                'published_at' => $this->resolvePublishedAt($data),
                'sort_order' => (int) ($data['sort_order'] ?? 0),
                'data' => $this->normalizeFieldData($contentType, $data['fields'] ?? []),
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        });
    }

    public function update(ContentType $contentType, ContentEntry $contentEntry, array $data, ?int $userId): ContentEntry
    {
        $this->ensureBelongsToType($contentType, $contentEntry);

        DB::transaction(function () use ($contentType, $contentEntry, $data, $userId): void {
            $contentEntry->update([
                'title' => $data['title'],
                'slug' => $this->uniqueSlug($contentType, $data['slug'] ?? null, $data['title'], $contentEntry),
                'excerpt' => $data['excerpt'] ?? null,
                'status' => $data['status'],
                'published_at' => $this->resolvePublishedAt($data),
                'sort_order' => (int) ($data['sort_order'] ?? 0),
                'data' => $this->normalizeFieldData($contentType, $data['fields'] ?? []),
                'updated_by' => $userId,
            ]);
        });

        return $contentEntry->refresh();
    }

    public function delete(ContentType $contentType, ContentEntry $contentEntry): void
    {
        $this->ensureBelongsToType($contentType, $contentEntry);
        $contentEntry->delete();
    }

    /**
     * @return array<string, mixed>
     */
    public function formData(ContentType $contentType, ?ContentEntry $contentEntry = null): array
    {
        $entryData = $contentEntry?->data ?? [];
        $fields = [];

        foreach ($this->dynamicContentFieldService->activeFieldsForContentType($contentType) as $field) {
            $fields[$field->name] = $this->dynamicContentFieldService->formValue(
                $field,
                array_key_exists($field->name, $entryData) ? $entryData[$field->name] : $field->default_value,
            );
        }

        return [
            'title' => $contentEntry?->title ?? '',
            'slug' => $contentEntry?->slug ?? '',
            'excerpt' => $contentEntry?->excerpt ?? '',
            'status' => $contentEntry?->status ?? 'draft',
            'published_at' => $contentEntry?->published_at?->format('Y-m-d\TH:i') ?? '',
            'sort_order' => $contentEntry?->sort_order ?? 0,
            'fields' => $fields,
        ];
    }

    public function ensureBelongsToType(ContentType $contentType, ContentEntry $contentEntry): void
    {
        abort_unless($contentEntry->content_type_id === $contentType->id, 404);
    }

    /**
     * @param  array<string, mixed>  $fieldValues
     * @return array<string, mixed>
     */
    private function normalizeFieldData(ContentType $contentType, array $fieldValues): array
    {
        $normalized = [];

        foreach ($this->dynamicContentFieldService->activeFieldsForContentType($contentType) as $field) {
            $normalized[$field->name] = $this->dynamicContentFieldService->normalizeValue(
                $field,
                $fieldValues[$field->name] ?? $field->default_value,
            );
        }

        return $normalized;
    }

    private function resolvePublishedAt(array $data): ?\Carbon\CarbonInterface
    {
        if (! empty($data['published_at'])) {
            return Carbon::parse($data['published_at']);
        }

        return $data['status'] === 'published' ? now() : null;
    }

    private function uniqueSlug(ContentType $contentType, ?string $slug, string $title, ?ContentEntry $ignore = null): string
    {
        $base = Str::slug($slug ?: $title) ?: Str::random(8);
        $candidate = $base;
        $suffix = 2;

        while ($this->slugExists($contentType, $candidate, $ignore)) {
            $candidate = "{$base}-{$suffix}";
            $suffix++;
        }

        return $candidate;
    }

    private function slugExists(ContentType $contentType, string $slug, ?ContentEntry $ignore): bool
    {
        return ContentEntry::withTrashed()
            ->where('content_type_id', $contentType->id)
            ->where('slug', $slug)
            ->when($ignore, fn (Builder $query) => $query->whereKeyNot($ignore->id))
            ->exists();
    }

}
