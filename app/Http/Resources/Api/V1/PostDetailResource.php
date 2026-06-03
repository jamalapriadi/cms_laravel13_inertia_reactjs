<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;

class PostDetailResource extends PostResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $translation = $this->resolvedTranslation();

        return array_merge(parent::toArray($request), [
            'content' => $translation?->content ?? $this->content,
            'blocks' => BlockResource::collection($this->whenLoaded('apiBlocksTree')),
            'seo' => [
                'title' => $this->metaValue('meta_title'),
                'description' => $this->metaValue('meta_description'),
            ],
            'language' => $this->resource->getAttribute('api_language'),
        ]);
    }
}
