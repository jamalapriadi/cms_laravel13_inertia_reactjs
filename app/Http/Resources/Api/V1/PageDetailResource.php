<?php

namespace App\Http\Resources\Api\V1;

use App\Models\PageTranslation;
use Illuminate\Http\Request;

class PageDetailResource extends PageResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $translation = $this->resolvedTranslation();

        return array_merge(parent::toArray($request), [
            'content' => $translation?->content ?? $this->content,
            'status' => $translation?->status ?? $this->status,
            'blocks' => BlockResource::collection($this->whenLoaded('apiBlocksTree')),
            'seo' => [
                'title' => $translation?->seo_title ?? $this->seo_title,
                'description' => $translation?->seo_description ?? $this->seo_description,
                'keywords' => $translation?->seo_keywords ?? $this->seo_keywords,
            ],
            'og_image' => $this->mediaUrl($this->og_image),
            'language' => $this->resource->getAttribute('api_language'),
            'translations' => $this->publishedTranslations(),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function publishedTranslations(): array
    {
        if (! $this->resource->relationLoaded('translations')) {
            return [];
        }

        return $this->translations
            ->filter(fn (PageTranslation $translation) => $translation->status === 'publish'
                && ($translation->published_at === null || $translation->published_at->lte(now())))
            ->map(fn (PageTranslation $translation) => [
                'language_id' => $translation->language_id,
                'title' => $translation->title,
                'slug' => $translation->slug,
                'excerpt' => $translation->excerpt,
                'published_at' => $translation->published_at?->toJSON(),
            ])
            ->values()
            ->all();
    }
}
