<?php

namespace App\Http\Resources\Api\V1;

use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EcommerceCategoryResource extends JsonResource
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
            'description' => $this->description,
            'image' => $this->mediaUrl($this->image),
            'parent_id' => $this->parent_id,
            'show_home' => (bool) $this->show_home,
            'is_publish' => (bool) $this->is_publish,
            'products_count' => $this->whenCounted('products'),
            'children' => EcommerceCategoryResource::collection($this->whenLoaded('children')),
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
