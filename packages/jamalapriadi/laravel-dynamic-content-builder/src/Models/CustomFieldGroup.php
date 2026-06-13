<?php

namespace Jamalapriadi\DynamicContentBuilder\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomFieldGroup extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'target_type',
        'target_id',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $attributes = [
        'target_type' => 'content_type',
        'is_active' => true,
        'sort_order' => 0,
    ];

    public function contentType(): BelongsTo
    {
        return $this->belongsTo(ContentType::class, 'target_id');
    }

    public function fields(): HasMany
    {
        return $this->hasMany(CustomField::class)->orderBy('sort_order');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeForContentType(Builder $query, string $contentTypeId): Builder
    {
        return $query
            ->where('target_type', 'content_type')
            ->where('target_id', $contentTypeId);
    }
}
