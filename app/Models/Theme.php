<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Theme extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'version',
        'author',
        'description',
        'namespace',
        'provider',
        'path',
        'screenshot',
        'manifest',
        'is_installed',
        'is_active',
    ];

    protected $casts = [
        'manifest' => 'array',
        'is_installed' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function settings(): HasMany
    {
        return $this->hasMany(ThemeSetting::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
