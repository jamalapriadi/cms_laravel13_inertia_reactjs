<?php

use App\Models\Dashboard\Option;
use App\Services\Cache\ListCacheService;

function get_option($key, $default = null)
{
    return cache()->rememberForever("option_{$key}", function () use ($key, $default) {
        $option = Option::where('key', $key)->first();

        return $option?->value ?? $default;
    });
}

function list_cache(): ListCacheService
{
    return app(ListCacheService::class);
}
