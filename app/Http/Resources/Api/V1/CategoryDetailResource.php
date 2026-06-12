<?php

namespace App\Http\Resources\Api\V1;

use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryDetailResource extends JsonResource
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
            'description' => $this->description ?? null,
            'image' => $this->mediaUrl($this->image),
            'parent' => $this->whenLoaded('parent', function (): array {
                return [
                    'id' => $this->parent->id,
                    'name' => $this->parent->name,
                    'slug' => $this->parent->slug,
                    'children' => CategoryResource::collection(
                        $this->parent->relationLoaded('children') ? $this->parent->children : collect()
                    ),
                ];
            }),
            'children' => CategoryResource::collection($this->whenLoaded('children')),
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
