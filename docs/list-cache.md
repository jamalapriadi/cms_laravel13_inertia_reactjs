# List Cache

List pages use `App\Services\Cache\ListCacheService` to cache paginated and collection-based responses without duplicating cache-key logic in controllers.

## How It Works

- `rememberRequest($module, $request, fn () => ...)` builds a key from route name, path, method, query parameters, route parameters, locale, authenticated user id, customer API user id, roles, permissions, and tenant/store request context.
- The cache key also includes a global version and per-module version so stale keys are naturally bypassed after invalidation.
- Redis and Memcached stores use cache tags.
- File and database stores fall back to a per-module key registry and versioned keys.

## Configuration

Use `.env`:

```env
LIST_CACHE_ENABLED=true
LIST_CACHE_TTL=900
```

Module TTLs and model invalidation rules live in `config/list-cache.php`.

## Adding Cache To A New List

Wrap only the list data creation, and keep the returned props or JSON shape unchanged:

```php
$props = app(ListCacheService::class)->rememberRequest('products', $request, fn () => [
    'products' => $query->paginate(10)->withQueryString(),
    'filters' => $request->only(['search']),
]);
```

## Invalidation

`App\Observers\ListCacheObserver` is registered for important models in `AppServiceProvider`. On `created`, `updated`, `deleted`, `restored`, and `forceDeleted`, it clears configured modules. Relational models such as product images, stock units, post translations, and collection items clear their parent list modules too.

## Manual Clear

```bash
php artisan list-cache:clear
php artisan list-cache:clear products
```

## Redis Recommendation

Redis is recommended for production because tag flushing is atomic and avoids maintaining a fallback key registry. File/database cache remains supported, but high-cardinality search/filter combinations can grow the registry until TTL expiry and invalidation clean it up.
