<?php

namespace App\Services\Api\V1;

use App\Models\Shop\SiteContent;
use App\Services\ActiveLanguageService;
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
     * @return array<string, mixed>
     */
    public function all(?string $requestedLocale = null): array
    {
        return $this->remember($requestedLocale, null);
    }

    /**
     * @return array<string, mixed>
     */
    public function group(string $group, ?string $requestedLocale = null): array
    {
        return $this->remember($requestedLocale, $this->normalizeGroup($group));
    }

    public function flushCache(): void
    {
        Cache::forever(self::CACHE_VERSION_KEY, (string) Str::uuid());
    }

    /**
     * @return array<string, mixed>
     */
    private function remember(?string $requestedLocale, ?string $group): array
    {
        $locale = $this->activeLanguageService->resolveLocale($requestedLocale);
        $fallbackLocale = $this->activeLanguageService->defaultCode();
        $version = $this->cacheVersion();
        $cacheKey = $this->cacheKey($version, $locale, $fallbackLocale, $group);

        return Cache::remember(
            $cacheKey,
            now()->addSeconds(self::CACHE_TTL_SECONDS),
            fn () => $this->buildPayload($requestedLocale, $locale, $fallbackLocale, $group)
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPayload(?string $requestedLocale, string $locale, string $fallbackLocale, ?string $group): array
    {
        $contents = SiteContent::query()
            ->active()
            ->group($group)
            ->with(['translations' => function ($query) use ($locale, $fallbackLocale): void {
                $query->whereIn('locale', array_values(array_unique([$locale, $fallbackLocale])));
            }])
            ->orderBy('group')
            ->orderBy('sort_order')
            ->orderBy('key')
            ->get();

        $items = $contents
            ->map(fn (SiteContent $content) => $this->contentItem($content, $locale, $fallbackLocale))
            ->values()
            ->all();

        return [
            'language' => [
                'requested' => $requestedLocale ? strtolower(trim($requestedLocale)) : null,
                'current' => $locale,
                'fallback' => $fallbackLocale,
                'active' => $this->activeLanguageService->activeCodes(),
            ],
            'group' => $group,
            'contents' => $group ? $this->flatContents($items) : $this->groupedContents($items),
            'items' => $items,
            'cache' => [
                'ttl_seconds' => self::CACHE_TTL_SECONDS,
                'generated_at' => now()->toIso8601String(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function contentItem(SiteContent $content, string $locale, string $fallbackLocale): array
    {
        $primaryValue = $content->translation($locale)?->value;
        $fallbackValue = $content->translation($fallbackLocale)?->value;
        $usesFallback = ! filled($primaryValue) && filled($fallbackValue);

        return [
            'id' => $content->id,
            'key' => $content->key,
            'group' => $content->group,
            'type' => $content->type,
            'value' => $content->value($locale, $fallbackLocale),
            'locale' => $usesFallback ? $fallbackLocale : $locale,
            'fallback_used' => $usesFallback,
            'sort_order' => $content->sort_order,
            'updated_at' => $content->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return array<string, string|null>
     */
    private function flatContents(array $items): array
    {
        return collect($items)
            ->mapWithKeys(fn (array $item) => [(string) $item['key'] => $item['value']])
            ->all();
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return array<string, array<string, string|null>>
     */
    private function groupedContents(array $items): array
    {
        return collect($items)
            ->groupBy(fn (array $item) => $item['group'] ?: 'ungrouped')
            ->map(fn ($groupItems) => $groupItems->mapWithKeys(
                fn (array $item) => [(string) $item['key'] => $item['value']]
            )->all())
            ->all();
    }

    private function cacheVersion(): string
    {
        $version = Cache::get(self::CACHE_VERSION_KEY);

        if (is_string($version) && $version !== '') {
            return $version;
        }

        $version = (string) Str::uuid();
        Cache::forever(self::CACHE_VERSION_KEY, $version);

        return $version;
    }

    private function cacheKey(string $version, string $locale, string $fallbackLocale, ?string $group): string
    {
        $payload = implode('|', [$version, $locale, $fallbackLocale, $group ?? '*']);

        return 'api:v1:site_contents:'.hash('sha256', $payload);
    }

    private function normalizeGroup(string $group): string
    {
        return strtolower(trim($group));
    }
}
