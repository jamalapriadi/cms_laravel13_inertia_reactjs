<?php

namespace App\Services\DynamicContent;

use App\Models\ContentType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ContentTypeService
{
    public function create(array $data, ?int $userId): ContentType
    {
        $contentType = DB::transaction(function () use ($data, $userId): ContentType {
            return ContentType::query()->create([
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['slug'] ?? null, $data['name']),
                'description' => $data['description'] ?? null,
                'icon' => $data['icon'] ?? null,
                'is_active' => (bool) ($data['is_active'] ?? true),
                'sort_order' => (int) ($data['sort_order'] ?? 0),
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        });

        $this->clearCaches();

        return $contentType;
    }

    public function update(ContentType $contentType, array $data, ?int $userId): ContentType
    {
        DB::transaction(function () use ($contentType, $data, $userId): void {
            $contentType->update([
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['slug'] ?? null, $data['name'], $contentType),
                'description' => $data['description'] ?? null,
                'icon' => $data['icon'] ?? null,
                'is_active' => (bool) ($data['is_active'] ?? true),
                'sort_order' => (int) ($data['sort_order'] ?? 0),
                'updated_by' => $userId,
            ]);
        });

        $contentType = $contentType->refresh();

        $this->clearCaches($contentType);

        return $contentType;
    }

    public function delete(ContentType $contentType): void
    {
        $contentTypeSlug = $contentType->slug;

        DB::transaction(function () use ($contentType): void {
            $contentType->entries()->get()->each->delete();

            $contentType->fieldGroups()->with('fields')->get()->each(function ($group): void {
                $group->fields->each->delete();
                $group->delete();
            });

            $contentType->delete();
        });

        $this->clearCaches(contentTypeSlug: $contentTypeSlug);
    }

    private function clearCaches(?ContentType $contentType = null, ?string $contentTypeSlug = null): void
    {
        $modules = ['content-types', 'custom-field-groups'];
        $slug = $contentTypeSlug ?? $contentType?->slug;

        if ($slug) {
            $modules[] = "dynamic-content:{$slug}";
        }

        list_cache()->clearMany($modules);
    }

    private function uniqueSlug(?string $slug, string $name, ?ContentType $ignore = null): string
    {
        $base = Str::slug($slug ?: $name) ?: Str::random(8);
        $candidate = $base;
        $suffix = 2;

        while ($this->slugExists($candidate, $ignore)) {
            $candidate = "{$base}-{$suffix}";
            $suffix++;
        }

        return $candidate;
    }

    private function slugExists(string $slug, ?ContentType $ignore): bool
    {
        return ContentType::withTrashed()
            ->where('slug', $slug)
            ->when($ignore, fn (Builder $query) => $query->whereKeyNot($ignore->id))
            ->exists();
    }
}
