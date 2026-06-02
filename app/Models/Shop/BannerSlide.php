<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BannerSlide extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'title',
        'subtitle',
        'description',
        'image',
        'mobile_image',
        'button_text',
        'button_url',
        'type',
        'position',
        'is_active',
        'sort_order',
        'start_at',
        'end_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

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

    public function scopeType(Builder $query, ?string $type): Builder
    {
        if (! $type) {
            return $query;
        }

        return $query->where('type', $type);
    }

    public function scopePosition(Builder $query, ?string $position): Builder
    {
        if (! $position) {
            return $query;
        }

        return $query->where('position', $position);
    }

    public function scopeHomepageMain(Builder $query): Builder
    {
        return $query->type('homepage')->position('main');
    }
}
