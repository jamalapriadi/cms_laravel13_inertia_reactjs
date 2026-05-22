<?php

namespace JamstackId\InertiaBlockEditor\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ContentBlock extends Model
{
    protected $fillable = [
        'blockable_type',
        'blockable_id',
        'parent_id',
        'type',
        'props',
        'styles',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'props' => 'array',
            'styles' => 'array',
            'sort_order' => 'integer',
        ];
    }

    public function getTable(): string
    {
        return config('inertia-block-editor.table', 'content_blocks');
    }

    public function blockable(): MorphTo
    {
        return $this->morphTo();
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }
}
