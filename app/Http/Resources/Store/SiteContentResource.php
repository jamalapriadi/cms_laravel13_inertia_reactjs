<?php

namespace App\Http\Resources\Store;

use App\Models\Shop\SiteContent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SiteContent */
class SiteContentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'group' => $this->group,
            'type' => $this->type,
            'is_active' => (bool) $this->is_active,
            'sort_order' => $this->sort_order,
            'translations' => $this->whenLoaded('translations', function () {
                return $this->translations
                    ->map(fn ($translation) => [
                        'id' => $translation->id,
                        'locale' => $translation->locale,
                        'value' => $translation->value,
                    ])
                    ->values()
                    ->all();
            }, []),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
