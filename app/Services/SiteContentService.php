<?php

namespace App\Services;

use App\Models\Shop\SiteContent;

class SiteContentService
{
    /**
     * @return array<string, string|null>
     */
    public function getGroup(string $group, string $locale, ?string $fallbackLocale = null): array
    {
        $contents = SiteContent::query()
            ->active()
            ->group($group)
            ->with(['translations' => function ($query) use ($locale, $fallbackLocale) {
                $locales = array_values(array_unique(array_filter([$locale, $fallbackLocale])));

                if ($locales !== []) {
                    $query->whereIn('locale', $locales);
                }
            }])
            ->orderBy('sort_order')
            ->get();

        return $contents->mapWithKeys(fn (SiteContent $content) => [
            $content->key => $content->value($locale, $fallbackLocale),
        ])->all();
    }

    /**
     * @param  list<string>  $keys
     * @return array<string, string|null>
     */
    public function getByKeys(array $keys, string $locale, ?string $fallbackLocale = null): array
    {
        if ($keys === []) {
            return [];
        }

        $contents = SiteContent::query()
            ->active()
            ->whereIn('key', $keys)
            ->with(['translations' => function ($query) use ($locale, $fallbackLocale) {
                $locales = array_values(array_unique(array_filter([$locale, $fallbackLocale])));

                if ($locales !== []) {
                    $query->whereIn('locale', $locales);
                }
            }])
            ->get();

        return collect($keys)
            ->mapWithKeys(function (string $key) use ($contents, $locale, $fallbackLocale) {
                $content = $contents->firstWhere('key', $key);

                return [
                    $key => $content?->value($locale, $fallbackLocale),
                ];
            })
            ->all();
    }
}
