<?php

namespace App\Http\Resources\Api\V1;

use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductCollectionResource extends JsonResource
{
    /**
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
            'banner_image' => $this->mediaUrl($this->banner_image),
            'is_active' => (bool) $this->is_active,
            'show_home' => (bool) $this->show_home,
            'start_at' => $this->start_at?->toJSON(),
            'end_at' => $this->end_at?->toJSON(),
            'sort_order' => $this->sort_order,
            'items_count' => $this->whenCounted('items'),
            'items' => ProductCollectionItemResource::collection($this->whenLoaded('items')),
        ];
    }

    protected function mediaUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return MediaPath::url($path);
    }
}
