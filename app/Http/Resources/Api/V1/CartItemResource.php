<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CartItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variant_item_id' => $this->product_variant_id,
            'qty' => (int) $this->qty,
            'price' => (float) $this->price,
            'subtotal' => (float) $this->subtotal,
            'stock_available' => $this->stockAvailable(),
            'product' => $this->productPayload(),
            'variant_item' => $this->variantPayload(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function productPayload(): ?array
    {
        if (! $this->relationLoaded('product') || ! $this->product) {
            return null;
        }

        return [
            'id' => $this->product->id,
            'name' => $this->product->name,
            'slug' => $this->product->slug,
            'sku' => $this->product->sku,
            'thumbnail' => $this->mediaUrl($this->product->thumbnail),
            'is_publish' => (bool) $this->product->is_publish,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function variantPayload(): ?array
    {
        if (! $this->relationLoaded('variant') || ! $this->variant) {
            return null;
        }

        return [
            'id' => $this->variant->id,
            'sku' => $this->variant->sku,
            'name' => $this->variant->name,
            'image' => $this->mediaUrl($this->variant->image),
            'selling_price' => (float) $this->variant->selling_price,
            'is_active' => (bool) $this->variant->is_active,
        ];
    }

    protected function stockAvailable(): int
    {
        if ($this->relationLoaded('variant') && $this->variant) {
            return (int) ($this->variant->available_stock_units_count ?? 0);
        }

        return (int) ($this->product?->available_stock_units_count ?? 0);
    }

    protected function mediaUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://', '/'])) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }
}
