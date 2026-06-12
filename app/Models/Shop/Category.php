<?php

/*
|--------------------------------------------------------------------------
| app/Models/Category.php
|--------------------------------------------------------------------------
*/

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'image',
        'sort_order',
        'show_home',
        'is_publish',
    ];

    protected $casts = [
        'show_home' => 'boolean',
        'is_publish' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
