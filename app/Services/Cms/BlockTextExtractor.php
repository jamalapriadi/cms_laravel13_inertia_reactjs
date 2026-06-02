<?php

namespace App\Services\Cms;

class BlockTextExtractor
{
    /**
     * @var list<string>
     */
    private array $ignoredKeys = [
        'id',
        'class',
        'classname',
        'style',
        'level',
        'tag',
        'src',
        'url',
        'href',
        'image',
        'icon',
        'target',
    ];

    /**
     * @return array<string, string>
     */
    public function extractTranslatableTexts(array $props): array
    {
        $result = [];
        $this->walk($props, '', $result);

        return $result;
    }

    /**
     * @param  array<string, string|null>  $translationsByPath
     */
    public function applyTranslations(array $props, array $translationsByPath): array
    {
        $translated = $props;

        foreach ($translationsByPath as $path => $value) {
            if (! is_string($path) || trim($path) === '' || ! is_string($value)) {
                continue;
            }

            $trimmed = trim($value);

            if ($trimmed === '') {
                continue;
            }

            $this->setByPath($translated, $path, $value);
        }

        return $translated;
    }

    /**
     * @param  array<string, string>  $result
     */
    private function walk(mixed $value, string $path, array &$result): void
    {
        if (is_array($value)) {
            foreach ($value as $key => $child) {
                $keyString = (string) $key;

                if ($this->shouldIgnoreKey($keyString)) {
                    continue;
                }

                $childPath = $path === '' ? $keyString : "{$path}.{$keyString}";
                $this->walk($child, $childPath, $result);
            }

            return;
        }

        if (! is_string($value)) {
            return;
        }

        if (! $this->isTranslatableString($value) || $path === '') {
            return;
        }

        $result[$path] = $value;
    }

    private function shouldIgnoreKey(string $key): bool
    {
        return in_array(strtolower($key), $this->ignoredKeys, true);
    }

    private function isTranslatableString(string $value): bool
    {
        $trimmed = trim($value);

        if ($trimmed === '') {
            return false;
        }

        if (filter_var($trimmed, FILTER_VALIDATE_URL)) {
            return false;
        }

        if (preg_match('/^(https?:\/\/|\/|data:|mailto:|tel:)/i', $trimmed)) {
            return false;
        }

        if (preg_match('/^#[a-f0-9]{3,8}$/i', $trimmed)) {
            return false;
        }

        if (preg_match('/^h[1-6]$/i', $trimmed)) {
            return false;
        }

        if (preg_match('/^[\d\W_]+$/u', $trimmed)) {
            return false;
        }

        return true;
    }

    private function setByPath(array &$array, string $path, string $value): void
    {
        $segments = explode('.', $path);
        $current = &$array;

        foreach ($segments as $index => $segment) {
            $isLast = $index === count($segments) - 1;

            if ($isLast) {
                $current[$segment] = $value;

                return;
            }

            if (! isset($current[$segment]) || ! is_array($current[$segment])) {
                $current[$segment] = [];
            }

            $current = &$current[$segment];
        }
    }
}
