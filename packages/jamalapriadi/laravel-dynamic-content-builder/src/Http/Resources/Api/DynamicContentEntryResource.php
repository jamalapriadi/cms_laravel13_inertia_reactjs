<?php

namespace Jamalapriadi\DynamicContentBuilder\Http\Resources\Api;

use Jamalapriadi\DynamicContentBuilder\Models\ContentEntry;
use Jamalapriadi\DynamicContentBuilder\Models\ContentType;
use Jamalapriadi\DynamicContentBuilder\Models\CustomField;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ContentEntry */
class DynamicContentEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content_type' => $this->contentTypePayload(),
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'status' => $this->status,
            'published_at' => $this->published_at?->format('Y-m-d H:i:s'),
            'sort_order' => $this->sort_order,
            'fields' => $this->fieldsPayload(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function contentTypePayload(): ?array
    {
        $contentType = $this->resource->relationLoaded('contentType')
            ? $this->resource->getRelation('contentType')
            : null;

        if (! $contentType instanceof ContentType) {
            return null;
        }

        return [
            'id' => $contentType->id,
            'name' => $contentType->name,
            'slug' => $contentType->slug,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function fieldsPayload(): array
    {
        $definitions = $this->resource->getAttribute('api_field_definitions');
        $mediaMap = $this->resource->getAttribute('api_media_map') ?? [];
        $payload = [];

        foreach ((array) $definitions as $name => $field) {
            if (! $field instanceof CustomField) {
                continue;
            }

            $value = $this->data[$name] ?? null;

            $payload[$name] = match ($field->type) {
                'image', 'file' => is_string($value) ? ($mediaMap[$value] ?? null) : null,
                'gallery' => collect((array) $value)
                    ->map(fn (mixed $item) => is_string($item) ? ($mediaMap[$item] ?? null) : null)
                    ->filter()
                    ->values()
                    ->all(),
                default => $value,
            };
        }

        return $payload;
    }
}
