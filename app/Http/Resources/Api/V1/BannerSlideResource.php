<?php

namespace App\Http\Resources\Api\V1;

use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BannerSlideResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'description' => $this->description,
            'image' => $this->image,
            'image_url' => $this->mediaUrl($this->image),
            'mobile_image' => $this->mobile_image,
            'mobile_image_url' => $this->mediaUrl($this->mobile_image),
            'button_text' => $this->button_text,
            'button_url' => $this->button_url,
            'type' => $this->type,
            'position' => $this->position,
            'placement' => trim((string) $this->type.'_'.(string) $this->position, '_'),
            'is_active' => (bool) $this->is_active,
            'sort_order' => $this->sort_order,
            'start_at' => $this->start_at?->toIso8601String(),
            'end_at' => $this->end_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    private function mediaUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return MediaPath::url($path);
    }
}
