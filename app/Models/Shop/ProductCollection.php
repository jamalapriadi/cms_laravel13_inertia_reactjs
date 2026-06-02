<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductCollection extends Model
{
    use HasUuids, SoftDeletes;

    public const TYPES = [
        'best_seller',
        'exclusive_deals',
        'big_sale',
        'flash_sale',
        'promo',
    ];

    protected $fillable = [
        'name',
        'slug',
        'type',
        'title',
        'description',
        'banner_image',
        'is_active',
        'show_home',
        'start_at',
        'end_at',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'show_home' => 'boolean',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(ProductCollectionItem::class)
            ->orderBy('sort_order')
            ->latest();
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->where('is_active', true)
            ->where(function (Builder $builder) {
                $builder->whereNull('start_at')->orWhere('start_at', '<=', now());
            })
            ->where(function (Builder $builder) {
                $builder->whereNull('end_at')->orWhere('end_at', '>=', now());
            });
    }

    public function scopeShowHome(Builder $query): Builder
    {
        return $query->where('show_home', true);
    }

    public function scopeType(Builder $query, ?string $type): Builder
    {
        if (! $type) {
            return $query;
        }

        return $query->where('type', $type);
    }
}
