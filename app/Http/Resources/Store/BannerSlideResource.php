<?php

namespace App\Http\Resources\Store;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin \App\Models\Shop\BannerSlide */
class BannerSlideResource extends JsonResource
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
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'description' => $this->description,
            'image' => $this->image,
            'image_url' => $this->toStorageUrl($this->image),
            'mobile_image' => $this->mobile_image,
            'mobile_image_url' => $this->toStorageUrl($this->mobile_image),
            'button_text' => $this->button_text,
            'button_url' => $this->button_url,
            'type' => $this->type,
            'position' => $this->position,
            'is_active' => (bool) $this->is_active,
            'sort_order' => $this->sort_order,
            'start_at' => $this->start_at?->toIso8601String(),
            'end_at' => $this->end_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    private function toStorageUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return Storage::disk('public')->url($path);
    }
}
