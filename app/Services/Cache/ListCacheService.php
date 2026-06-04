<?php

namespace App\Services\Cache;

use Closure;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ListCacheService
{
    public function rememberRequest(string $module, Request $request, Closure $callback, ?int $ttl = null, array $extra = []): mixed
    {
        return $this->remember($module, $this->requestContext($request, $extra), $callback, $ttl);
    }

    public function remember(string $module, array $context, Closure $callback, ?int $ttl = null): mixed
    {
        if (! $this->enabled()) {
            return $callback();
        }

        $module = $this->normalizeModule($module);
        $key = $this->key($module, $context);
        $ttl ??= $this->ttl($module);
        $cacheableCallback = fn () => $this->normalizeForCache($callback());

        if ($this->supportsTags()) {
            return Cache::tags($this->tags($module))->remember($key, now()->addSeconds($ttl), $cacheableCallback);
        }

        $this->rememberFallbackKey($module, $key);

        return Cache::remember($key, now()->addSeconds($ttl), $cacheableCallback);
    }

    public function clear(?string $module = null): void
    {
        if ($module) {
            $this->clearModule($this->normalizeModule($module));

            return;
        }

        foreach ($this->knownModules() as $knownModule) {
            $this->clearModule($knownModule);
        }

        $this->bumpVersion('global');
    }

    /**
     * @param  iterable<string>  $modules
     */
    public function clearMany(iterable $modules): void
    {
        foreach ($modules as $module) {
            $this->clear($module);
        }
    }

    public function key(string $module, array $context): string
    {
        $module = $this->normalizeModule($module);

        $payload = [
            'module' => $module,
            'global_version' => $this->version('global'),
            'module_version' => $this->version($module),
            'context' => $this->normalizeContext($context),
        ];

        return $this->prefix().':'.$module.':'.hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));
    }

    public function moduleRegistryKey(string $module): string
    {
        return $this->prefix().':registry:'.$this->normalizeModule($module);
    }

    public function modulesRegistryKey(): string
    {
        return $this->prefix().':registry:modules';
    }

    public function supportsTags(): bool
    {
        $store = config('cache.default');
        $driver = config("cache.stores.{$store}.driver", $store);

        return in_array($driver, config('list-cache.taggable_stores', ['redis', 'memcached']), true);
    }

    public function enabled(): bool
    {
        return (bool) config('list-cache.enabled', true);
    }

    /**
     * @return array<string, mixed>
     */
    private function requestContext(Request $request, array $extra): array
    {
        return [
            'route' => optional($request->route())->getName(),
            'path' => $request->path(),
            'method' => $request->method(),
            'query' => $request->query(),
            'route_parameters' => $this->routeParameters($request),
            'locale' => app()->getLocale(),
            'user' => $this->userContext($request),
            'tenant' => $this->tenantContext($request),
            'extra' => $extra,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function routeParameters(Request $request): array
    {
        $route = $request->route();

        if (! $route) {
            return [];
        }

        return collect($route->parameters())
            ->map(fn (mixed $value) => is_object($value) && method_exists($value, 'getKey') ? $value->getKey() : $value)
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function userContext(Request $request): array
    {
        $webUser = $request->user();
        $customer = $request->user('customer_api');

        return [
            'default_guard' => Auth::getDefaultDriver(),
            'web_id' => $webUser?->getAuthIdentifier(),
            'customer_api_id' => $customer?->getAuthIdentifier(),
            'roles' => $webUser && method_exists($webUser, 'getRoleNames')
                ? $webUser->getRoleNames()->sort()->values()->all()
                : [],
            'permissions' => $webUser && method_exists($webUser, 'getAllPermissions')
                ? $webUser->getAllPermissions()->pluck('name')->sort()->values()->all()
                : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function tenantContext(Request $request): array
    {
        return [
            'tenant_id' => $request->attributes->get('tenant_id')
                ?? $request->headers->get('X-Tenant-Id')
                ?? session('tenant_id'),
            'store_id' => $request->attributes->get('store_id')
                ?? $request->headers->get('X-Store-Id')
                ?? session('store_id'),
        ];
    }

    /**
     * @return list<string>
     */
    private function tags(string $module): array
    {
        return [$this->prefix(), $this->prefix().':'.$module];
    }

    private function ttl(string $module): int
    {
        return (int) Arr::get(
            config('list-cache.modules', []),
            $module.'.ttl',
            config('list-cache.default_ttl', 900)
        );
    }

    /**
     * @return list<string>
     */
    private function knownModules(): array
    {
        $configured = array_keys(config('list-cache.modules', []));
        $registered = Cache::get($this->modulesRegistryKey(), []);

        return collect([...$configured, ...$registered])
            ->filter()
            ->map(fn (string $module) => $this->normalizeModule($module))
            ->unique()
            ->values()
            ->all();
    }

    private function clearModule(string $module): void
    {
        if ($this->supportsTags()) {
            Cache::tags($this->tags($module))->flush();
        }

        foreach (Cache::get($this->moduleRegistryKey($module), []) as $key) {
            Cache::forget($key);
        }

        Cache::forget($this->moduleRegistryKey($module));
        $this->bumpVersion($module);
    }

    private function rememberFallbackKey(string $module, string $key): void
    {
        $modules = collect(Cache::get($this->modulesRegistryKey(), []))
            ->push($module)
            ->unique()
            ->values()
            ->all();

        Cache::forever($this->modulesRegistryKey(), $modules);

        $keys = collect(Cache::get($this->moduleRegistryKey($module), []))
            ->push($key)
            ->unique()
            ->values()
            ->all();

        Cache::forever($this->moduleRegistryKey($module), $keys);
    }

    private function version(string $module): string
    {
        $key = $this->versionKey($module);
        $version = Cache::get($key);

        if (is_string($version) && $version !== '') {
            return $version;
        }

        return $this->bumpVersion($module);
    }

    private function bumpVersion(string $module): string
    {
        $version = (string) Str::uuid();

        Cache::forever($this->versionKey($module), $version);

        return $version;
    }

    private function versionKey(string $module): string
    {
        return $this->prefix().':version:'.$module;
    }

    private function prefix(): string
    {
        return trim((string) config('list-cache.prefix', 'list-cache'), ':');
    }

    private function normalizeModule(string $module): string
    {
        return Str::of($module)->lower()->replace(['/', ' '], ['.', '-'])->toString();
    }

    private function normalizeContext(mixed $value): mixed
    {
        if ($value instanceof \BackedEnum) {
            return $value->value;
        }

        if ($value instanceof \UnitEnum) {
            return $value->name;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format(DATE_ATOM);
        }

        if (is_object($value)) {
            if (method_exists($value, 'getKey')) {
                return [
                    'class' => $value::class,
                    'key' => $value->getKey(),
                ];
            }

            return method_exists($value, '__toString') ? (string) $value : $value::class;
        }

        if (! is_array($value)) {
            return $value;
        }

        ksort($value);

        return array_map(fn (mixed $item) => $this->normalizeContext($item), $value);
    }

    private function normalizeForCache(mixed $value): mixed
    {
        if ($value instanceof Arrayable) {
            return $this->normalizeForCache($value->toArray());
        }

        if ($value instanceof \JsonSerializable) {
            return $this->normalizeForCache($value->jsonSerialize());
        }

        if ($value instanceof \BackedEnum) {
            return $value->value;
        }

        if ($value instanceof \UnitEnum) {
            return $value->name;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format(DATE_ATOM);
        }

        if (is_array($value)) {
            return array_map(fn (mixed $item) => $this->normalizeForCache($item), $value);
        }

        if (is_object($value)) {
            return method_exists($value, '__toString')
                ? (string) $value
                : $this->normalizeForCache(get_object_vars($value));
        }

        return $value;
    }
}
