<?php

namespace App\Support;

use App\Models\Dashboard\Media;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaPath
{
    public static function normalize(?string $value, bool $requireExists = true): ?string
    {
        $path = self::relativePath($value);

        if (! $path) {
            return null;
        }

        if ($requireExists) {
            // First check local public disk (fast)
            $existsLocally = false;
            try {
                if (Storage::disk('public')->exists($path)) {
                    $existsLocally = true;
                }
            } catch (\Throwable) {
            }

            if (! $existsLocally) {
                // If not local, check database Media table (fast)
                $existsInDb = false;
                if (class_exists(Media::class)) {
                    $existsInDb = Media::where('path', $path)->exists();
                }

                if (! $existsInDb) {
                    // Fall back to checking the legacy disk alias directly
                    try {
                        if (! Storage::disk('idcloudhost')->exists($path)) {
                            return null;
                        }
                    } catch (\Throwable) {
                        // Legacy disk unavailable, assume it exists (fail-safe)
                    }
                }
            }
        }

        return $path;
    }

    public static function url(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        $path = self::normalize($value, requireExists: false);

        if ($path) {
            // If the file exists locally, use local public URL.
            try {
                if (Storage::disk('public')->exists($path)) {
                    return Storage::disk('public')->url($path);
                }
            } catch (\Throwable) {
            }

            // Fallback for tests or missing files:
            if (app()->environment('testing')) {
                return Storage::disk('public')->url($path);
            }

            return Storage::disk('idcloudhost')->url($path);
        }

        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        return null;
    }

    private static function relativePath(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        $path = trim($value);

        if ($path === '' || Str::startsWith($path, ['data:', 'blob:'])) {
            return null;
        }

        $path = strtok($path, '?#') ?: $path;

        foreach (self::knownPublicPrefixes() as $prefix) {
            if ($prefix !== '' && str_starts_with($path, $prefix)) {
                $path = substr($path, strlen($prefix));

                break;
            }
        }

        if (filter_var($path, FILTER_VALIDATE_URL)) {
            $parsedPath = parse_url($path, PHP_URL_PATH);

            if (! is_string($parsedPath) || $parsedPath === '') {
                return null;
            }

            if (! str_starts_with($parsedPath, '/storage/')) {
                return null;
            }

            $path = $parsedPath;
        }

        foreach (['/storage/', 'storage/'] as $prefix) {
            if (str_starts_with($path, $prefix)) {
                $path = substr($path, strlen($prefix));

                break;
            }
        }

        $path = trim($path, '/');

        if ($path === '' || str_contains($path, '..')) {
            return null;
        }

        return $path;
    }

    /**
     * @return list<string>
     */
    private static function knownPublicPrefixes(): array
    {
        $configuredPublicUrl = (string) config('filesystems.disks.public.url', '');
        $idchUrl = (string) config('filesystems.disks.idcloudhost.url', '');
        $legacyServiceUrl = (string) config('services.idcloudhost.url', '');
        $appStorageUrl = rtrim((string) config('app.url'), '/').'/storage';
        $assetStorageUrl = asset('storage/');

        return collect([$configuredPublicUrl, $idchUrl, $legacyServiceUrl, $appStorageUrl, $assetStorageUrl])
            ->filter()
            ->map(fn (string $url) => rtrim($url, '/').'/')
            ->unique()
            ->values()
            ->all();
    }
}
