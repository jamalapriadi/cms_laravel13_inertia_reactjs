<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

class MediaPath
{
    public static function normalize(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        $path = trim($value);

        if (str_starts_with($path, asset('storage/'))) {
            $path = substr($path, strlen(asset('storage/')));
        }

        if (str_starts_with($path, '/storage/')) {
            $path = substr($path, strlen('/storage/'));
        }

        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, strlen('storage/'));
        }

        $path = trim($path, '/');

        if ($path === '' || str_contains($path, '..')) {
            return null;
        }

        return Storage::disk('public')->exists($path) ? $path : null;
    }
}
