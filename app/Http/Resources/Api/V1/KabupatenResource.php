<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KabupatenResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'province_id' => $this->province_id,
            'name' => $this->name,
            'province' => new ProvinceResource($this->whenLoaded('province')),
            'kecamatans' => KecamatanResource::collection($this->whenLoaded('kecamatans')),
        ];
    }
}
