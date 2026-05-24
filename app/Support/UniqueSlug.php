<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class UniqueSlug
{
    public static function make(
        string $modelClass,
        string $value,
        string $column = 'slug',
        ?string $ignoreId = null,
    ): string {
        /** @var Model $model */
        $model = new $modelClass;
        $baseSlug = Str::slug($value) ?: 'item';
        $slug = $baseSlug;
        $suffix = 2;

        while (self::exists($model, $column, $slug, $ignoreId)) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    private static function exists(
        Model $model,
        string $column,
        string $slug,
        ?string $ignoreId,
    ): bool {
        $query = $model->newQuery();

        if (method_exists($model, 'bootSoftDeletes')) {
            $query->withTrashed();
        }

        if ($ignoreId) {
            $query->whereKeyNot($ignoreId);
        }

        return $query->where($column, $slug)->exists();
    }
}
