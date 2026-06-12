<?php

namespace App\Http\Resources\Api\V1;

use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BrandDetailResource extends JsonResource
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
            'logo' => $this->mediaUrl($this->logo),
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
