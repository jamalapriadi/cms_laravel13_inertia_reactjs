<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SiteContent extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'key',
        'group',
        'type',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(SiteContentTranslation::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeGroup(Builder $query, ?string $group): Builder
    {
        if (! $group) {
            return $query;
        }

        return $query->where('group', $group);
    }

    public function scopeType(Builder $query, ?string $type): Builder
    {
        if (! $type) {
            return $query;
        }

        return $query->where('type', $type);
    }

    public function translation(?string $locale): ?SiteContentTranslation
    {
        if (! $locale) {
            return null;
        }

        if ($this->relationLoaded('translations')) {
            return $this->translations->firstWhere('locale', strtolower($locale));
        }

        return $this->translations()->where('locale', strtolower($locale))->first();
    }

    public function value(?string $locale, ?string $fallbackLocale = null): ?string
    {
        $primary = $this->translation($locale)?->value;

        if (filled($primary)) {
            return $primary;
        }

        if ($fallbackLocale) {
            $fallback = $this->translation($fallbackLocale)?->value;

            if (filled($fallback)) {
                return $fallback;
            }
        }

        return null;
    }
}
