<?php

use App\CMS\Themes\FallbackAdminLoginViewData;
use App\CMS\Themes\ThemeManager;
use App\Models\Dashboard\Option;
use App\Services\Cache\ListCacheService;
use Illuminate\Support\Facades\Schema;

function get_option($key, $default = null)
{
    try {
        if (! Schema::hasTable('options')) {
            return $default;
        }

        return cache()->rememberForever("option_{$key}", function () use ($key, $default) {
            $option = Option::where('key', $key)->first();

            return $option?->value ?? $default;
        });
    } catch (Throwable) {
        return $default;
    }
}

function list_cache(): ListCacheService
{
    return app(ListCacheService::class);
}

function theme_asset(string $path): string
{
    return app(ThemeManager::class)->asset($path);
}

function theme_assets(string $type = 'css'): array
{
    return app(ThemeManager::class)->assets($type);
}

function theme_setting(string $key, mixed $default = null): mixed
{
    return app(ThemeManager::class)->setting($key, $default);
}

function theme_admin_login_url(): string
{
    return app(FallbackAdminLoginViewData::class)->adminLoginUrl();
}

function theme_template(string $key, ?string $fallback = null): ?string
{
    return app(ThemeManager::class)->template($key, $fallback);
}
