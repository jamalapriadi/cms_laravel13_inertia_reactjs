<?php

namespace App\Http\Resources\Store;

use App\Models\Shop\ProductCollection;
use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductCollection */
class ProductCollectionResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,
            'banner_image' => $this->banner_image,
            'banner_image_url' => $this->toStorageUrl($this->banner_image),
            'is_active' => (bool) $this->is_active,
            'show_home' => (bool) $this->show_home,
            'start_at' => $this->start_at?->toIso8601String(),
            'end_at' => $this->end_at?->toIso8601String(),
            'sort_order' => $this->sort_order,
            'items_count' => $this->items_count ?? 0,
            'items' => ProductCollectionItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    private function toStorageUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return MediaPath::url($path);
    }
}
