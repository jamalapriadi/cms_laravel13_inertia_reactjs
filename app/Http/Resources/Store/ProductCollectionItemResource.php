<?php

namespace App\Http\Resources\Store;

use App\Models\Shop\ProductCollectionItem;
use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductCollectionItem */
class ProductCollectionItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $product = $this->resource->relationLoaded('product') ? $this->product : null;
        $variantItem = $this->resource->relationLoaded('variantItem') ? $this->variantItem : null;
        $variantOptionsLabel = $variantItem && method_exists($variantItem, 'relationLoaded') && $variantItem->relationLoaded('options')
            ? $variantItem->options
                ->map(fn ($option) => trim(($option->variant?->name ?? '').': '.$option->value))
                ->filter()
                ->implode(' / ')
            : null;

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variant_item_id' => $this->variant_item_id,
            'product_name' => $product?->name,
            'product_slug' => $product?->slug,
            'variant_name' => $variantOptionsLabel
                ? trim(($variantItem?->name ?? '').' ('.$variantOptionsLabel.')')
                : $variantItem?->name,
            'sku' => $variantItem?->sku ?? $product?->sku,
            'price' => (float) ($variantItem?->selling_price ?? $product?->base_price ?? 0),
            'image' => $this->toStorageUrl($variantItem?->image ?? $product?->thumbnail),
            'stock' => $variantItem?->stock,
            'sort_order' => $this->sort_order,
        ];
    }

    private function toStorageUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return MediaPath::url($path);
    }
}
