<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductCollectionItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variant_item_id' => $this->variant_item_id,
            'sort_order' => $this->sort_order,
            'product' => ProductResource::make($this->whenLoaded('product')),
            'variant_item' => VariantItemResource::make($this->whenLoaded('variantItem')),
        ];
    }
}
