<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $payload = [
            'id' => $this['id'],
            'title' => $this['title'],
            'type' => $this['type'],
            'url' => $this['url'],
            'target' => $this['target'],
            'icon' => $this['icon'],
            'meta' => $this['meta'],
            'children' => MenuItemResource::collection(collect($this['children'] ?? [])),
        ];

        if (array_key_exists('items', $this->resource)) {
            $payload['items'] = MenuDynamicProductResource::collection(collect($this['items'] ?? []));
        }

        return $payload;
    }
}
