<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Faq extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'question',
        'answer',
        'type',
        'position',
        'is_active',
        'show_home',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'show_home' => 'boolean',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
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

    public function scopePosition(Builder $query, ?string $position): Builder
    {
        if (! $position) {
            return $query;
        }

        return $query->where('position', $position);
    }
}
