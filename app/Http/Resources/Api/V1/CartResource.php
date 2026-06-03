<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cart_token' => $this->cart_token,
            'customer_id' => $this->customer_id,
            'is_guest' => $this->customer_id === null,
            'total_qty' => (int) $this->total_qty,
            'total_price' => (float) $this->total_price,
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
