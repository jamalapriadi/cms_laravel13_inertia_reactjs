<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShippingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'courier' => $this->courier,
            'tracking_number' => $this->tracking_number,
            'status' => $this->status,
            'shipping_cost' => (float) $this->shipping_cost,
            'shipping_address' => $this->shipping_address,
            'shipped_at' => $this->shipped_at?->toJSON(),
            'delivered_at' => $this->delivered_at?->toJSON(),
        ];
    }
}
