<?php

namespace Jamalapriadi\DynamicContentBuilder\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomField extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'custom_field_group_id',
        'label',
        'name',
        'type',
        'placeholder',
        'instructions',
        'options',
        'default_value',
        'validation_rules',
        'is_required',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'options' => 'array',
        'default_value' => 'array',
        'validation_rules' => 'array',
        'is_required' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $attributes = [
        'is_required' => false,
        'is_active' => true,
        'sort_order' => 0,
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(CustomFieldGroup::class, 'custom_field_group_id');
    }
}
