<?php

namespace App\Services\Cms;

use App\Models\Dashboard\Language;
use App\Models\Post;

class PostContentResolver
{
    public function __construct(
        private readonly LanguageManager $languageManager
    ) {}

    public function resolve(Post $post, ?Language $language = null): array
    {
        $defaultLanguage = $this->languageManager->getDefaultLanguage();
        $targetLanguage = $language ?? $defaultLanguage;

        if (! $targetLanguage) {
            return [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'content' => $post->content,
                'status' => $post->status,
                'published_at' => $post->published_at?->toIso8601String(),
                'blocks' => $post->blocks()->orderBy('order')->get()->map(fn ($block) => [
                    'id' => $block->id,
                    'parent_id' => $block->parent_id,
                    'type' => $block->type,
                    'order' => $block->order,
                    'props' => $block->props ?? [],
                    'styles' => $block->styles ?? [],
                ])->all(),
            ];
        }

        $post->loadMissing([
            'translations',
            'blocks' => fn ($query) => $query->orderBy('order'),
            'blocks.translations',
        ]);

        return $post->resolveForLanguage($targetLanguage, $defaultLanguage);
    }
}
