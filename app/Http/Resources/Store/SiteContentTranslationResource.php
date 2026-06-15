<?php

namespace App\Http\Resources\Store;

use App\Models\Shop\SiteContentTranslation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SiteContentTranslation */
class SiteContentTranslationResource extends JsonResource
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
            'locale' => $this->locale,
            'value' => $this->value,
        ];
    }
}
