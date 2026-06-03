<?php

namespace App\Http\Resources\Api\V1;

use App\Models\PostCategory;
use App\Models\TermTaxonomy;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        if ($this->resource instanceof TermTaxonomy) {
            return [
                'id' => $this->id,
                'name' => $this->term?->name,
                'slug' => $this->term?->slug,
            ];
        }

        if ($this->resource instanceof PostCategory) {
            return [
                'id' => $this->id,
                'name' => $this->category_name,
                'slug' => $this->slug,
            ];
        }

        return [
            'id' => $this->id ?? null,
            'name' => $this->name ?? null,
            'slug' => $this->slug ?? null,
        ];
    }
}
