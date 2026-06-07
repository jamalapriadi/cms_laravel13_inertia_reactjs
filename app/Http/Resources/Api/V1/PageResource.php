<?php

namespace App\Http\Resources\Api\V1;

use App\Models\PageTranslation;
use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class PageResource extends JsonResource
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
            'excerpt' => $translation?->excerpt ?? $this->excerpt($translation?->content ?? $this->content),
            'featured_image' => $this->mediaUrl($this->featured_image),
            'published_at' => ($translation?->published_at ?? $this->published_at)?->toJSON(),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }

    protected function resolvedTranslation(): ?PageTranslation
    {
        if (! $this->resource->relationLoaded('apiResolvedTranslation')) {
            return null;
        }

        $translation = $this->resource->getRelation('apiResolvedTranslation');

        return $translation instanceof PageTranslation ? $translation : null;
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
                    foreach (['text', 'title', 'subtitle', 'caption', 'html'] as $key) {
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
