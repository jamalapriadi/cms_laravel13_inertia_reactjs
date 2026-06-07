<?php

namespace App\Models;

use App\Models\Dashboard\Language;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Page extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content',
        'status',
        'featured_image',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'og_image',
        'published_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function blocks(): HasMany
    {
        return $this->hasMany(Block::class)->orderBy('order');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(PageTranslation::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('status', 'publish')
            ->where(function (Builder $query): void {
                $query->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            });
    }

    public function translationForLanguage(int $languageId, ?int $fallbackLanguageId = null): ?PageTranslation
    {
        /** @var Collection<int, PageTranslation> $translations */
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
