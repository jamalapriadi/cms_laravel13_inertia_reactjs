<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;

class ProductDetailResource extends ProductResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'description' => $this->description,
            'unit' => $this->whenLoaded('unit', fn () => [
                'id' => $this->unit?->id,
                'name' => $this->unit?->name,
                'code' => $this->unit?->code,
            ]),
            'images' => $this->images
                ->map(fn ($image) => [
                    'id' => $image->id,
                    'url' => $this->mediaUrl($image->image),
                    'is_primary' => (bool) $image->is_primary,
                    'sort_order' => $image->sort_order,
                ])
                ->values(),
            'specifications' => ProductSpecificationResource::collection($this->whenLoaded('specifications')),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'variant_items' => VariantItemResource::collection($this->whenLoaded('variantItems')),
            'seo' => [
                'title' => $this->meta_title,
                'description' => $this->meta_description,
            ],
        ]);
    }
}
