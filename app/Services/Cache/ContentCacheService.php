<?php

namespace App\Services\Cache;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ContentCacheService
{
    private const REGISTRY_KEY = 'content-cache:registry';

    /**
     * Determine if the default cache store supports tags.
     */
    public function supportsTags(): bool
    {
        $store = config('cache.default');
        $driver = config("cache.stores.{$store}.driver", $store);

        return in_array($driver, config('list-cache.taggable_stores', ['redis', 'memcached']), true);
    }

    /**
     * Generate a consistent cache key with standard and hash components.
     */
    public function generateKey(string $slug, string $locale, int $page, int $perPage, array $queryParams): string
    {
        // Exclude pagination and locale from query hash to keep key structure distinct
        $filteredParams = collect($queryParams)
            ->except(['locale', 'page', 'per_page'])
            ->sortKeys()
            ->toArray();

        $queryHash = $filteredParams ? md5(json_encode($filteredParams)) : 'empty';

        return "api:content:{$slug}:locale:{$locale}:page:{$page}:per_page:{$perPage}:hash:{$queryHash}";
    }

    /**
     * Cache remember query response wrapper.
     */
    public function remember(
        string $slug,
        string $locale,
        int $page,
        int $perPage,
        array $queryParams,
        \Closure $callback,
        ?int $ttl = null
    ): mixed {
        $key = $this->generateKey($slug, $locale, $page, $perPage, $queryParams);
        $ttl ??= config('list-cache.default_ttl', 900);

        if (config('app.debug')) {
            Log::debug("ContentCache: Remembering key [{$key}] with TTL [{$ttl}]");
        }

        if ($this->supportsTags()) {
            return Cache::tags([
                'content',
                "content:{$slug}",
                "locale:{$locale}",
                'content_entries',
                'api_content',
            ])->remember($key, now()->addSeconds($ttl), $callback);
        }

        $this->registerKey($key);

        return Cache::remember($key, now()->addSeconds($ttl), $callback);
    }

    /**
     * Clear dynamic content cache specifically for a slug.
     */
    public function clearBySlug(string $slug): void
    {
        if ($this->supportsTags()) {
            Cache::tags("content:{$slug}")->flush();

            return;
        }

        $this->clearWithPattern("api:content:{$slug}:");
    }

    /**
     * Clear dynamic content cache specifically for a locale.
     */
    public function clearByLocale(string $locale): void
    {
        if ($this->supportsTags()) {
            Cache::tags("locale:{$locale}")->flush();

            return;
        }

        $this->clearWithPattern(":locale:{$locale}:");
    }

    /**
     * Clear all dynamic content API cache.
     */
    public function clearAll(): void
    {
        if ($this->supportsTags()) {
            Cache::tags([
                'content',
                'content_entries',
                'api_content',
                'site_content',
                'menus',
            ])->flush();

            return;
        }

        $this->clearWithPattern('');
    }

    /**
     * Register a generated cache key to the registry when tags are not supported.
     */
    private function registerKey(string $key): void
    {
        $keys = Cache::get(self::REGISTRY_KEY, []);
        if (! in_array($key, $keys, true)) {
            $keys[] = $key;
            Cache::forever(self::REGISTRY_KEY, $keys);
        }
    }

    /**
     * Filter the registry and clear matched keys.
     */
    private function clearWithPattern(string $pattern): void
    {
        $keys = Cache::get(self::REGISTRY_KEY, []);
        $remainingKeys = [];

        foreach ($keys as $key) {
            if ($pattern === '' || str_contains($key, $pattern)) {
                if (config('app.debug')) {
                    Log::debug("ContentCache: Forgetting key [{$key}]");
                }
                Cache::forget($key);
            } else {
                $remainingKeys[] = $key;
            }
        }

        if ($pattern === '') {
            Cache::forget(self::REGISTRY_KEY);
        } else {
            Cache::forever(self::REGISTRY_KEY, $remainingKeys);
        }
    }
}
