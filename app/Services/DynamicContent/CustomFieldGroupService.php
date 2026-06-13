<?php

namespace App\Services\DynamicContent;

use App\Models\ContentType;
use App\Models\CustomField;
use App\Models\CustomFieldGroup;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CustomFieldGroupService
{
    public function __construct(
        private readonly DynamicContentFieldService $dynamicContentFieldService
    ) {}

    public function createGroup(array $data): CustomFieldGroup
    {
        $contentType = ContentType::query()->findOrFail($data['content_type_id']);

        $group = DB::transaction(function () use ($data, $contentType): CustomFieldGroup {
            return CustomFieldGroup::query()->create([
                'name' => $data['name'],
                'slug' => $this->uniqueGroupSlug($contentType->id, $data['slug'] ?? null, $data['name']),
                'description' => $data['description'] ?? null,
                'target_type' => 'content_type',
                'target_id' => $contentType->id,
                'is_active' => (bool) ($data['is_active'] ?? true),
                'sort_order' => (int) ($data['sort_order'] ?? 0),
            ]);
        });

        $this->clearCaches($contentType);

        return $group;
    }

    public function updateGroup(CustomFieldGroup $group, array $data): CustomFieldGroup
    {
        $contentType = ContentType::query()->findOrFail($data['content_type_id']);

        DB::transaction(function () use ($group, $data, $contentType): void {
            $group->update([
                'name' => $data['name'],
                'slug' => $this->uniqueGroupSlug($contentType->id, $data['slug'] ?? null, $data['name'], $group),
                'description' => $data['description'] ?? null,
                'target_type' => 'content_type',
                'target_id' => $contentType->id,
                'is_active' => (bool) ($data['is_active'] ?? true),
                'sort_order' => (int) ($data['sort_order'] ?? 0),
            ]);
        });

        $group = $group->refresh();

        $this->clearCaches($contentType);

        return $group;
    }

    public function deleteGroup(CustomFieldGroup $group): void
    {
        $contentType = $group->contentType;

        DB::transaction(function () use ($group): void {
            $group->fields()->get()->each->delete();
            $group->delete();
        });

        if ($contentType) {
            $this->clearCaches($contentType);
        }
    }

    public function createField(CustomFieldGroup $group, array $data): CustomField
    {
        $field = DB::transaction(function () use ($group, $data): CustomField {
            $payload = $this->dynamicContentFieldService->normalizeDefinitionPayload($data);

            return $group->fields()->create($payload);
        });

        $this->clearCachesForGroup($group);

        return $field;
    }

    public function updateField(CustomFieldGroup $group, CustomField $field, array $data): CustomField
    {
        DB::transaction(function () use ($group, $field, $data): void {
            $this->ensureFieldBelongsToGroup($group, $field);
            $field->update($this->dynamicContentFieldService->normalizeDefinitionPayload($data));
        });

        $field = $field->refresh();

        $this->clearCachesForGroup($group);

        return $field;
    }

    public function deleteField(CustomFieldGroup $group, CustomField $field): void
    {
        $this->ensureFieldBelongsToGroup($group, $field);

        $field->delete();

        $this->clearCachesForGroup($group);
    }

    public function moveField(CustomFieldGroup $group, CustomField $field, string $direction): void
    {
        $this->ensureFieldBelongsToGroup($group, $field);

        $fields = $group->fields()
            ->orderBy('sort_order')
            ->orderBy('label')
            ->get()
            ->values();

        $currentIndex = $fields->search(fn (CustomField $item) => $item->is($field));

        if (! is_int($currentIndex)) {
            return;
        }

        $swapIndex = $direction === 'up' ? $currentIndex - 1 : $currentIndex + 1;
        $swapField = $fields->get($swapIndex);

        if (! $swapField instanceof CustomField) {
            return;
        }

        DB::transaction(function () use ($field, $swapField): void {
            $currentSortOrder = $field->sort_order;
            $field->update(['sort_order' => $swapField->sort_order]);
            $swapField->update(['sort_order' => $currentSortOrder]);
        });

        $this->clearCachesForGroup($group);
    }

    private function clearCachesForGroup(CustomFieldGroup $group): void
    {
        $this->clearCaches($group->contentType()->first());
    }

    private function clearCaches(?ContentType $contentType): void
    {
        $modules = ['custom-field-groups', 'content-types'];

        if ($contentType) {
            $modules[] = "dynamic-content:{$contentType->slug}";
        }

        list_cache()->clearMany($modules);
    }

    private function ensureFieldBelongsToGroup(CustomFieldGroup $group, CustomField $field): void
    {
        abort_unless($field->custom_field_group_id === $group->id, 404);
    }

    private function uniqueGroupSlug(string $contentTypeId, ?string $slug, string $name, ?CustomFieldGroup $ignore = null): string
    {
        $base = Str::slug($slug ?: $name) ?: Str::random(8);
        $candidate = $base;
        $suffix = 2;

        while ($this->groupSlugExists($contentTypeId, $candidate, $ignore)) {
            $candidate = "{$base}-{$suffix}";
            $suffix++;
        }

        return $candidate;
    }

    private function groupSlugExists(string $contentTypeId, string $slug, ?CustomFieldGroup $ignore): bool
    {
        return CustomFieldGroup::withTrashed()
            ->where('target_type', 'content_type')
            ->where('target_id', $contentTypeId)
            ->where('slug', $slug)
            ->when($ignore, fn (Builder $query) => $query->whereKeyNot($ignore->id))
            ->exists();
    }
}
