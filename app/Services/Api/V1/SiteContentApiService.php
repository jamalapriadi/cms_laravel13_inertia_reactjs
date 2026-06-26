<?php

namespace App\Services\Api\V1;

use App\Models\Shop\SiteContent;
use App\Services\ActiveLanguageService;
use App\Support\MediaPath;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class SiteContentApiService
{
    private const CACHE_VERSION_KEY = 'api:v1:site_contents:version';

    private const CACHE_TTL_SECONDS = 86400;

    public function __construct(
        private readonly ActiveLanguageService $activeLanguageService
    ) {}

    /**
     * Get public site contents based on filters.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>|LengthAwarePaginator|list<array<string, mixed>>
     */
    public function getPublicContents(array $filters = []): array|LengthAwarePaginator
    {
        $locale = $this->activeLanguageService->resolveLocale($filters['locale'] ?? $filters['lang'] ?? null);
        $fallbackLocale = $this->activeLanguageService->defaultCode();
        $includeAllLocales = (bool) ($filters['include_all_locales'] ?? false);
        $format = $filters['format'] ?? 'grouped';

        $query = SiteContent::query()
            ->active()
            ->when(! empty($filters['group']), fn ($q) => $q->group($filters['group']))
            ->when(! empty($filters['key']), fn ($q) => $q->where('key', $filters['key']))
            ->when(! empty($filters['type']), fn ($q) => $q->type($filters['type']))
            ->orderBy('group')
            ->orderBy('sort_order')
            ->orderBy('key');

        if ($includeAllLocales) {
            $query->with('translations');
        } else {
            $query->with(['translations' => function ($q) use ($locale, $fallbackLocale): void {
                $q->whereIn('locale', array_values(array_unique([$locale, $fallbackLocale])));
            }]);
        }

        // Handle pagination if requested
        if (isset($filters['page']) || isset($filters['per_page'])) {
            $perPage = $filters['per_page'] ?? 15;
            $paginator = $query->paginate($perPage);

            // Transform paginator items
            $transformedItems = collect($paginator->items())->map(function (SiteContent $content) use ($locale, $fallbackLocale, $includeAllLocales) {
                return $this->transformContent($content, $locale, $fallbackLocale, $includeAllLocales);
            })->all();

            // Replace the items in the paginator
            return new LengthAwarePaginator(
                $transformedItems,
                $paginator->total(),
                $paginator->perPage(),
                $paginator->currentPage(),
                ['path' => LengthAwarePaginator::resolveCurrentPath()]
            );
        }

        $contents = $query->get();

        if ($format === 'list') {
            return $contents->map(function (SiteContent $content) use ($locale, $fallbackLocale, $includeAllLocales) {
                return $this->transformContent($content, $locale, $fallbackLocale, $includeAllLocales);
            })->all();
        }

        return $this->groupContents($contents, $locale, $fallbackLocale, $includeAllLocales);
    }

    /**
     * Get a single public site content by key.
     *
     * @return array<string, mixed>|null
     */
    public function getPublicContentByKey(string $key, ?string $requestedLocale = null): ?array
    {
        $locale = $this->activeLanguageService->resolveLocale($requestedLocale);
        $fallbackLocale = $this->activeLanguageService->defaultCode();

        $content = SiteContent::query()
            ->active()
            ->where('key', $key)
            ->with(['translations' => function ($q) use ($locale, $fallbackLocale): void {
                $q->whereIn('locale', array_values(array_unique([$locale, $fallbackLocale])));
            }])
            ->first();

        if (! $content) {
            return null;
        }

        return $this->transformContent($content, $locale, $fallbackLocale, false);
    }

    /**
     * Transform a single site content model into a normalized array structure.
     *
     * @return array<string, mixed>
     */
    private function transformContent(SiteContent $content, string $locale, string $fallbackLocale, bool $includeAllLocales): array
    {
        if ($includeAllLocales) {
            $values = [];
            foreach ($this->activeLanguageService->activeCodes() as $activeLocale) {
                $rawVal = $content->translation($activeLocale)?->value;
                $values[$activeLocale] = $this->normalizeValue($rawVal, $content->type);
            }

            return [
                'key' => $content->key,
                'group' => $content->group,
                'type' => $content->type,
                'values' => $values,
            ];
        }

        $primaryValue = $content->translation($locale)?->value;
        $fallbackValue = $content->translation($fallbackLocale)?->value;
        $usesFallback = ! filled($primaryValue) && filled($fallbackValue);
        $resolvedLocale = $usesFallback ? $fallbackLocale : $locale;
        $rawValue = $usesFallback ? $fallbackValue : $primaryValue;

        return [
            'key' => $content->key,
            'group' => $content->group,
            'locale' => $resolvedLocale,
            'type' => $content->type,
            'value' => $this->normalizeValue($rawValue, $content->type),
        ];
    }

    /**
     * Group contents collection into a nested key-value array format.
     *
     * @return array<string, array<string, mixed>>
     */
    public function groupContents(Collection $contents, string $locale, string $fallbackLocale, bool $includeAllLocales): array
    {
        $grouped = [];

        foreach ($contents as $content) {
            $group = $content->group ?: 'ungrouped';

            if ($includeAllLocales) {
                $values = [];
                foreach ($this->activeLanguageService->activeCodes() as $activeLocale) {
                    $rawVal = $content->translation($activeLocale)?->value;
                    $values[$activeLocale] = $this->normalizeValue($rawVal, $content->type);
                }
                $grouped[$group][$content->key] = $values;
            } else {
                $primaryValue = $content->translation($locale)?->value;
                $fallbackValue = $content->translation($fallbackLocale)?->value;
                $rawValue = ! filled($primaryValue) && filled($fallbackValue) ? $fallbackValue : $primaryValue;
                $grouped[$group][$content->key] = $this->normalizeValue($rawValue, $content->type);
            }
        }

        return $grouped;
    }

    /**
     * Normalize values based on type.
     */
    public function normalizeValue(mixed $value, ?string $type): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'boolean' => in_array(strtolower((string) $value), ['1', 'true', 'on', 'yes'], true),
            'number' => str_contains((string) $value, '.') ? (float) $value : (int) $value,
            'json' => $this->safeJsonDecode($value),
            'image' => MediaPath::url((string) $value),
            default => (string) $value,
        };
    }

    /**
     * Safely decode JSON.
     */
    private function safeJsonDecode(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        try {
            return json_decode($value, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return $value;
        }
    }

    /**
     * Backward-compatible helper to flush cache.
     */
    public function flushCache(): void
    {
        Cache::forever(self::CACHE_VERSION_KEY, (string) Str::uuid());
    }

    // Keep these methods for backward compatibility, routing, and usage
    public function all(?string $requestedLocale = null): array
    {
        return $this->getPublicContents([
            'locale' => $requestedLocale,
            'format' => 'grouped',
        ]);
    }

    public function group(string $group, ?string $requestedLocale = null): array
    {
        $locale = $this->activeLanguageService->resolveLocale($requestedLocale);
        $fallbackLocale = $this->activeLanguageService->defaultCode();

        $contents = SiteContent::query()
            ->active()
            ->group($group)
            ->with(['translations' => function ($q) use ($locale, $fallbackLocale): void {
                $q->whereIn('locale', array_values(array_unique([$locale, $fallbackLocale])));
            }])
            ->orderBy('sort_order')
            ->orderBy('key')
            ->get();

        $items = $contents->map(function (SiteContent $content) use ($locale, $fallbackLocale) {
            $primaryValue = $content->translation($locale)?->value;
            $fallbackValue = $content->translation($fallbackLocale)?->value;
            $usesFallback = ! filled($primaryValue) && filled($fallbackValue);

            return [
                'id' => $content->id,
                'key' => $content->key,
                'group' => $content->group,
                'type' => $content->type,
                'value' => $this->normalizeValue($usesFallback ? $fallbackValue : $primaryValue, $content->type),
                'locale' => $usesFallback ? $fallbackLocale : $locale,
                'fallback_used' => $usesFallback,
                'sort_order' => $content->sort_order,
                'updated_at' => $content->updated_at?->toIso8601String(),
            ];
        })->values()->all();

        return [
            'language' => [
                'requested' => $requestedLocale ? strtolower(trim($requestedLocale)) : null,
                'current' => $locale,
                'fallback' => $fallbackLocale,
                'active' => $this->activeLanguageService->activeCodes(),
            ],
            'group' => $group,
            'contents' => collect($items)->mapWithKeys(fn (array $item) => [(string) $item['key'] => $item['value']])->all(),
            'items' => $items,
        ];
    }
}
