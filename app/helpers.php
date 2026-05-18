<?php 

use App\Models\Dashboard\Option;

function get_option($key, $default = null)
{
    return cache()->rememberForever("option_{$key}", function () use ($key, $default) {
        $option = Option::where('key', $key)->first();
        return $option?->value ?? $default;
    });
}