<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlockResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'type' => $this->type,
            'sort_order' => $this->order,
            'data' => $this->resource->getAttribute('api_resolved_props') ?? $this->props ?? (object) [],
            'styles' => $this->styles ?? (object) [],
            'children' => BlockResource::collection($this->whenLoaded('children')),
        ];
    }
}
