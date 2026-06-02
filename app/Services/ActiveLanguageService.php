<?php

namespace App\Services;

use App\Models\Dashboard\Language;
use App\Models\Dashboard\Option;
use Illuminate\Support\Collection;

class ActiveLanguageService
{
    /**
     * @return list<string>
     */
    public function activeCodes(): array
    {
        $raw = Option::query()->where('key', 'languages')->first()?->value;
        $codes = $this->normalizeCodes($raw);

        if ($codes === []) {
            $fallback = Option::query()->where('key', 'default_language')->first()?->value;
            $codes = $this->normalizeCodes($fallback);
        }

        return collect($codes)
            ->filter(fn ($code) => is_string($code) && $code !== '')
            ->map(fn (string $code) => strtolower($code))
            ->unique()
            ->values()
            ->all();
    }

    public function activeLanguages(): Collection
    {
        $codes = $this->activeCodes();

        if ($codes === []) {
            return collect();
        }

        $languages = Language::query()
            ->get(['id', 'code', 'english_name', 'default_locale']);

        return collect($codes)
            ->map(fn (string $code) => $languages->first(
                fn (Language $language) => strtolower((string) $language->code) === $code
            ))
            ->filter();
    }

    public function defaultCode(): string
    {
        $activeCodes = $this->activeCodes();

        $default = Option::query()->where('key', 'default_language')->first()?->value;
        $default = is_string($default) ? strtolower($default) : null;

        if ($default && in_array($default, $activeCodes, true)) {
            return $default;
        }

        if ($activeCodes !== []) {
            return $activeCodes[0];
        }

        return strtolower((string) config('app.fallback_locale', 'en'));
    }

    public function resolveLocale(?string $locale): string
    {
        $normalized = $locale ? strtolower($locale) : null;

        if ($normalized && in_array($normalized, $this->activeCodes(), true)) {
            return $normalized;
        }

        return $this->defaultCode();
    }

    /**
     * @return list<string>
     */
    private function normalizeCodes(mixed $raw): array
    {
        if (is_array($raw)) {
            return collect($raw)->values()->all();
        }

        if (! is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return array_is_list($decoded)
                ? $decoded
                : array_values($decoded);
        }

        if (str_contains($raw, ',')) {
            return array_values(array_filter(array_map('trim', explode(',', $raw))));
        }

        return [trim($raw)];
    }
}
