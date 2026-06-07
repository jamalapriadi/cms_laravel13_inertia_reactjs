<?php

namespace App\Models;

use App\Models\Dashboard\Language;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Block extends Model
{
    protected $fillable = [
        'post_id',
        'page_id',
        'parent_id',
        'type',
        'props',
        'styles',
        'order',
    ];

    protected $casts = [
        'props' => 'array',
        'styles' => 'array',
    ];

    public function children(): HasMany
    {
        return $this->hasMany(Block::class, 'parent_id')->orderBy('order');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Block::class, 'parent_id');
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(BlockTranslation::class);
    }

    public function translationForLanguage(int $languageId, ?int $fallbackLanguageId = null): ?BlockTranslation
    {
        /** @var Collection<int, BlockTranslation> $translations */
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

    public function resolvePropsForLanguage(Language $language, ?Language $fallbackLanguage = null): array
    {
        $originalProps = is_array($this->props) ? $this->props : [];
        $translation = $this->translationForLanguage(
            $language->id,
            $fallbackLanguage?->id
        );

        $translatedProps = is_array($translation?->props) ? $translation->props : [];

        return array_replace_recursive($originalProps, $translatedProps);
    }
}
