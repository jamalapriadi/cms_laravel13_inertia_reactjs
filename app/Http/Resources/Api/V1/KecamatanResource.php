<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KecamatanResource extends JsonResource
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
            'kabupaten_id' => $this->kabupaten_id,
            'name' => $this->name,
            'kabupaten' => new KabupatenResource($this->whenLoaded('kabupaten')),
            'kelurahans' => KelurahanResource::collection($this->whenLoaded('kelurahans')),
        ];
    }
}
