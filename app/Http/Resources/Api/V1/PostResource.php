<?php

namespace App\Http\Resources\Api\V1;

use App\Models\PostMeta;
use App\Models\PostTranslation;
use App\Models\TermTaxonomy;
use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class PostResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $translation = $this->resolvedTranslation();

        return [
            'id' => $this->id,
            'title' => $translation?->title ?? $this->title,
            'slug' => $translation?->slug ?? $this->slug,
            'excerpt' => $this->excerpt($translation?->content ?? $this->content),
            'thumbnail' => $this->mediaUrl($this->metaValue('featured_image')),
            'published_at' => ($translation?->published_at ?? $this->published_at)?->toJSON(),
            'categories' => CategoryResource::collection($this->categories()),
        ];
    }

    protected function resolvedTranslation(): ?PostTranslation
    {
        if (! $this->resource->relationLoaded('apiResolvedTranslation')) {
            return null;
        }

        $translation = $this->resource->getRelation('apiResolvedTranslation');

        return $translation instanceof PostTranslation ? $translation : null;
    }

    /**
     * @return list<object>
     */
    protected function categories(): array
    {
        $taxonomyCategories = $this->resource->relationLoaded('taxonomies')
            ? $this->taxonomies
                ->filter(fn (TermTaxonomy $taxonomy) => $taxonomy->taxonomy === 'categories')
                ->values()
            : collect();

        $postCategory = $this->resource->relationLoaded('apiPostCategory')
            ? $this->resource->getRelation('apiPostCategory')
            : null;

        return $taxonomyCategories
            ->when($postCategory, fn ($categories) => $categories->push($postCategory))
            ->filter()
            ->unique(fn ($category) => $category->slug ?? $category->term?->slug ?? $category->id)
            ->values()
            ->all();
    }

    protected function metaValue(string $key): ?string
    {
        if (! $this->resource->relationLoaded('metas')) {
            return null;
        }

        $meta = $this->metas->firstWhere('meta_key', $key);

        return $meta instanceof PostMeta && is_string($meta->meta_value)
            ? $meta->meta_value
            : null;
    }

    protected function mediaUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return MediaPath::url($path);
    }

    protected function excerpt(?string $content): ?string
    {
        $text = trim($this->textFromContent($content));

        if ($text === '') {
            return null;
        }

        return Str::limit($text, 160);
    }

    protected function textFromContent(?string $content): string
    {
        if (! $content) {
            return '';
        }

        $decoded = json_decode($content, true);

        if (is_array($decoded)) {
            return $this->textFromBlocks($decoded);
        }

        return trim(preg_replace('/\s+/', ' ', strip_tags($content)) ?? '');
    }

    /**
     * @param  array<int|string, mixed>  $blocks
     */
    protected function textFromBlocks(array $blocks): string
    {
        return collect($blocks)
            ->flatMap(function (mixed $block): array {
                if (! is_array($block)) {
                    return [];
                }

                $data = $block['data'] ?? $block['props'] ?? [];
                $children = is_array($block['children'] ?? null) ? $block['children'] : [];
                $texts = [];

                if (is_array($data)) {
                    foreach (['text', 'title', 'caption', 'html'] as $key) {
                        if (! empty($data[$key]) && is_string($data[$key])) {
                            $texts[] = strip_tags($data[$key]);
                        }
                    }
                }

                if ($children !== []) {
                    $texts[] = $this->textFromBlocks($children);
                }

                return $texts;
            })
            ->filter()
            ->implode(' ');
    }
}
