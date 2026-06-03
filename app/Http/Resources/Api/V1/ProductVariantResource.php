<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'sort_order' => $this->sort_order,
            'options' => $this->options
                ->map(fn ($option) => [
                    'id' => $option->id,
                    'value' => $option->value,
                    'sort_order' => $option->sort_order,
                ])
                ->values(),
        ];
    }
}
