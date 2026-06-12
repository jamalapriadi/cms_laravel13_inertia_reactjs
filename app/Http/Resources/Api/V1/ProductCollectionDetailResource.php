<?php

namespace App\Http\Resources\Api\V1;

use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductCollectionDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $bannerImage = $this->mediaUrl($this->banner_image);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,
            'banner' => $bannerImage,
            'banner_image' => $bannerImage,
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
