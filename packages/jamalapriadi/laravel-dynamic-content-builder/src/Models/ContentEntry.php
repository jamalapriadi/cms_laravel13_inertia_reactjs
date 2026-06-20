<?php

namespace Jamalapriadi\DynamicContentBuilder\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContentEntry extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'content_type_id',
        'title',
        'slug',
        'excerpt',
        'status',
        'published_at',
        'sort_order',
        'data',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'sort_order' => 'integer',
        'data' => 'array',
    ];

    protected $attributes = [
        'status' => 'draft',
        'sort_order' => 0,
    ];

    public function contentType(): BelongsTo
    {
        return $this->belongsTo(ContentType::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo($this->userModel(), 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo($this->userModel(), 'updated_by');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('status', 'published')
            ->where(function (Builder $query): void {
                $query->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            });
    }

    private function userModel(): string
    {
        return (string) config('auth.providers.users.model', 'App\\Models\\User');
    }

    public function translations()
    {
        return $this->hasMany(\App\Models\ContentEntryTranslation::class);
    }

    public function translationForLanguage(int $languageId, ?int $fallbackLanguageId = null): ?\App\Models\ContentEntryTranslation
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\ContentEntryTranslation> $translations */
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

    public function resolveTranslation(int $languageId, ?int $fallbackLanguageId = null): self
    {
        $translation = $this->translationForLanguage($languageId, $fallbackLanguageId);

        if ($translation) {
            $this->title = $translation->title ?: $this->title;
            $this->slug = $translation->slug ?: $this->slug;
            $this->excerpt = $translation->excerpt ?: $this->excerpt;
            $this->status = $translation->status ?: $this->status;
            if ($translation->published_at) {
                $this->published_at = $translation->published_at;
            }

            if (is_array($translation->data)) {
                $originalData = is_array($this->data) ? $this->data : [];
                $mergedData = $originalData;
                foreach ($translation->data as $key => $value) {
                    if (! blank($value)) {
                        $mergedData[$key] = $value;
                    }
                }
                $this->data = $mergedData;
            }
        }

        return $this;
    }
}
