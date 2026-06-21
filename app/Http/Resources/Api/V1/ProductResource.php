<?php

namespace App\Http\Resources\Api\V1;

use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $priceRange = $this->priceRange();
        $sellingPrice = $priceRange['min'] ?? (float) $this->base_price;
        $stock = $this->stockTotal();
        $hasStock = $stock > 0;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'short_description' => $this->shortDescription(),
            'brand' => EcommerceBrandResource::make($this->whenLoaded('brand')),
            'categories' => EcommerceCategoryResource::collection(collect([$this->whenLoaded('category')])->filter()),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'thumbnail' => $this->thumbnail(),
            'price' => (float) $this->base_price,
            'min_price' => $priceRange['min'],
            'max_price' => $priceRange['max'],
            'selling_price' => $sellingPrice,
            'discount_price' => null,
            'final_price' => $sellingPrice,
            'price_range' => $priceRange,
            'stock' => $stock,
            'stock_total' => $stock,
            'has_stock' => $hasStock,
            'stock_status' => $hasStock ? 'in_stock' : 'out_of_stock',
            'sold_count' => (int) ($this->sold_count ?? 0),
            'has_variant' => (bool) $this->has_variant,
            'is_publish' => (bool) $this->is_publish,
            'status' => (bool) $this->is_publish ? 'published' : 'draft',
            'condition' => $this->condition,
            'created_at' => $this->created_at?->toJSON(),
        ];
    }

    /**
     * @return array{min: float, max: float}
     */
    protected function priceRange(): array
    {
        if ($this->variant_min_price !== null || $this->variant_max_price !== null) {
            $basePrice = (float) $this->base_price;

            return [
                'min' => (float) ($this->variant_min_price ?? $basePrice),
                'max' => (float) ($this->variant_max_price ?? $basePrice),
            ];
        }

        $prices = $this->relationLoaded('variantItems')
            ? $this->variantItems
                ->where('is_active', true)
                ->pluck('selling_price')
                ->map(fn ($price): float => (float) $price)
                ->filter(fn (float $price): bool => $price > 0)
                ->values()
            : collect();

        if ($prices->isEmpty()) {
            $basePrice = (float) $this->base_price;

            return [
                'min' => $basePrice,
                'max' => $basePrice,
            ];
        }

        return [
            'min' => (float) $prices->min(),
            'max' => (float) $prices->max(),
        ];
    }

    protected function stockTotal(): int
    {
        if ($this->stock_total !== null) {
            return (int) $this->stock_total;
        }

        return (int) ($this->available_stock_units_count ?? 0);
    }

    protected function thumbnail(): ?string
    {
        $primaryImage = $this->relationLoaded('images')
            ? $this->images->firstWhere('is_primary', true) ?? $this->images->first()
            : null;

        return $this->mediaUrl($primaryImage?->image ?? $this->thumbnail);
    }

    protected function shortDescription(): ?string
    {
        $text = trim(strip_tags((string) $this->description));

        return $text === '' ? null : Str::limit($text, 160);
    }

    protected function mediaUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return MediaPath::url($path);
    }
}
