<?php

namespace App\Models;

use App\Models\Dashboard\Language;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'type',
        'status',
        'parent_id',
        'mime_type',
        'comment_status',
        'published_at',
    ];

    protected $casts = [
        'comment_status' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function metas(): HasMany
    {
        return $this->hasMany(PostMeta::class);
    }

    public function featuredImage()
    {
        return $this->hasOne(PostMeta::class)
            ->where('meta_key', 'featured_image');
    }

    public function taxonomies()
    {
        return $this->belongsToMany(
            TermTaxonomy::class,
            'term_relationships'
        )->withTimestamps();
    }

    public function categories()
    {
        return $this->taxonomies()->where('taxonomy', 'categories');
    }

    public function tags()
    {
        return $this->taxonomies()->where('taxonomy', 'tags');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function blocks(): HasMany
    {
        return $this->hasMany(Block::class)->orderBy('order');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(PostTranslation::class);
    }

    public function translationForLanguage(int $languageId, ?int $fallbackLanguageId = null): ?PostTranslation
    {
        /** @var Collection<int, PostTranslation> $translations */
        $translations = $this->relationLoaded('translations')
            ? $this->translations
            : $this->translations()->get();

        $translation = $translations->firstWhere('language_id', $languageId);

        if ($translation) {
            return $translation;
        }

        if ($fallbackLanguageId) {
            return $translations->firstWhere('language_id', $fallbackLanguageId);
        }

        return null;
    }

    public function resolveForLanguage(Language $language, ?Language $fallbackLanguage = null): array
    {
        $translation = $this->translationForLanguage(
            $language->id,
            $fallbackLanguage?->id
        );

        $blocks = $this->relationLoaded('blocks')
            ? $this->blocks
            : $this->blocks()->get();

        return [
            'id' => $this->id,
            'title' => $translation?->title ?: $this->title,
            'slug' => $translation?->slug ?: $this->slug,
            'excerpt' => $translation?->excerpt ?: $this->excerpt,
            'content' => $translation?->content ?: $this->content,
            'status' => $translation?->status ?: $this->status,
            'published_at' => optional($translation?->published_at ?: $this->published_at)?->toIso8601String(),
            'blocks' => $blocks->map(fn (Block $block) => [
                'id' => $block->id,
                'parent_id' => $block->parent_id,
                'type' => $block->type,
                'order' => $block->order,
                'props' => $block->resolvePropsForLanguage($language, $fallbackLanguage),
                'styles' => $block->styles ?? [],
            ])->values()->all(),
        ];
    }
}
