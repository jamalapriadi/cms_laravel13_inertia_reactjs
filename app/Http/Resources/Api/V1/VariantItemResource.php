<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VariantItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sku' => $this->sku,
            'name' => $this->name,
            'image' => $this->mediaUrl($this->image),
            'selling_price' => (float) $this->selling_price,
            'final_price' => (float) $this->selling_price,
            'stock' => $this->available_stock_units_count ?? $this->stock,
            'stock_status' => ($this->available_stock_units_count ?? $this->stock) > 0 ? 'in_stock' : 'out_of_stock',
            'is_active' => (bool) $this->is_active,
            'unit' => $this->whenLoaded('unit', fn () => [
                'id' => $this->unit?->id,
                'name' => $this->unit?->name,
                'code' => $this->unit?->code,
            ]),
            'options' => $this->options
                ->map(fn ($option) => [
                    'variant' => $option->variant?->name,
                    'value' => $option->value,
                ])
                ->values(),
        ];
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
