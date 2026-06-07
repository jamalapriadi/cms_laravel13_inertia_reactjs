<?php

namespace App\Services\Cms;

use App\Models\Dashboard\Language;
use App\Models\Dashboard\Option;
use Illuminate\Support\Collection;

class LanguageManager
{
    public function getDefaultLanguage(): ?Language
    {
        $defaultCode = $this->normalizeCode(Option::getByKey('default_language'));

        if (! $defaultCode) {
            return $this->fallbackLanguage();
        }

        return Language::query()
            ->whereRaw('LOWER(code) = ?', [$defaultCode])
            ->first() ?? $this->fallbackLanguage();
    }

    public function getEnabledLanguages(): Collection
    {
        $enabledCodes = $this->normalizeCodes(Option::getByKey('languages'));

        if ($enabledCodes === []) {
            $default = $this->getDefaultLanguage();

            return $default ? collect([$default]) : collect();
        }

        $languages = Language::query()->get();

        return collect($enabledCodes)
            ->map(fn (string $code) => $languages->first(
                fn (Language $language) => strtolower((string) $language->code) === $code
            ))
            ->filter()
            ->values();
    }

    public function resolveLanguageByLocale(?string $locale): ?Language
    {
        $normalized = $this->normalizeCode($locale);
        $enabledLanguages = $this->getEnabledLanguages();

        if (! $normalized) {
            return $this->getDefaultLanguage();
        }

        $match = $enabledLanguages->first(function (Language $language) use ($normalized) {
            $code = $this->normalizeCode($language->code);
            $defaultLocale = $this->normalizeCode($language->default_locale);
            $tag = $this->normalizeCode($language->tag);

            return in_array($normalized, array_filter([$code, $defaultLocale, $tag]), true);
        });

        return $match ?: $this->getDefaultLanguage();
    }

    private function normalizeCode(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $normalized = strtolower(trim($value));

        return $normalized === '' ? null : $normalized;
    }

    private function fallbackLanguage(): ?Language
    {
        return Language::query()
            ->orderByDesc('active')
            ->orderByDesc('major')
            ->oldest('id')
            ->first();
    }

    /**
     * @return list<string>
     */
    private function normalizeCodes(mixed $raw): array
    {
        if (is_array($raw)) {
            return collect($raw)
                ->map(fn ($value) => $this->normalizeCode($value))
                ->filter()
                ->unique()
                ->values()
                ->all();
        }

        if (! is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $this->normalizeCodes($decoded);
        }

        if (str_contains($raw, ',')) {
            return collect(explode(',', $raw))
                ->map(fn (string $value) => $this->normalizeCode($value))
                ->filter()
                ->unique()
                ->values()
                ->all();
        }

        $single = $this->normalizeCode($raw);

        return $single ? [$single] : [];
    }
}
