<?php

namespace Jamalapriadi\DynamicContentBuilder\Http\Controllers\Dashboard;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class MediaLibraryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $disk = Storage::disk($this->disk());
        $path = $this->sanitizePath((string) $request->query('path', ''));
        $directory = $this->directoryFor($path);

        $files = collect($disk->files($directory))
            ->filter(fn (string $file) => ! $this->isHiddenPath($file))
            ->sort()
            ->values()
            ->map(fn (string $file) => $this->filePayload($disk, $file))
            ->all();

        return response()->json([
            'data' => $files,
            'currentPath' => $path,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $rules = ['required', 'file', 'max:'.(int) config('dynamic-content-builder.media.max_upload_size_kb', 10240)];
        $extensions = config('dynamic-content-builder.media.allowed_extensions', []);

        if (is_array($extensions) && $extensions !== []) {
            $rules[] = 'mimes:'.implode(',', $extensions);
        }

        $validated = $request->validate([
            'file' => $rules,
            'path' => ['nullable', 'string'],
        ]);

        $path = $this->sanitizePath((string) ($validated['path'] ?? ''));
        $storedPath = $request->file('file')->store($this->directoryFor($path), $this->disk());
        $disk = Storage::disk($this->disk());

        return response()->json([
            'success' => true,
            'data' => $this->filePayload($disk, $storedPath),
        ], 201);
    }

    private function disk(): string
    {
        return (string) config('dynamic-content-builder.media.disk', 'public');
    }

    private function rootDirectory(): string
    {
        return trim((string) config('dynamic-content-builder.media.directory', 'dynamic-content-builder'), '/');
    }

    private function sanitizePath(string $path): string
    {
        $path = trim($path, '/');

        abort_if(str_contains($path, '..'), 404);

        return $path;
    }

    private function directoryFor(string $path): string
    {
        $root = $this->rootDirectory();

        return trim($root.($path !== '' ? "/{$path}" : ''), '/');
    }

    /**
     * @return array<string, mixed>
     */
    private function filePayload($disk, string $path): array
    {
        return [
            'name' => basename($path),
            'path' => $path,
            'url' => $disk->url($path),
            'mime_type' => $this->safeMimeType($disk, $path),
            'size' => $this->safeSize($disk, $path),
            'last_modified' => $this->safeLastModified($disk, $path),
        ];
    }

    private function isHiddenPath(string $path): bool
    {
        return collect(explode('/', trim($path, '/')))
            ->contains(fn (string $segment) => str_starts_with($segment, '.'));
    }

    private function safeMimeType($disk, string $path): ?string
    {
        try {
            return $disk->mimeType($path) ?: null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function safeSize($disk, string $path): ?int
    {
        try {
            return $disk->size($path) ?: null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function safeLastModified($disk, string $path): ?string
    {
        try {
            $timestamp = $disk->lastModified($path);

            return $timestamp ? date('Y-m-d H:i:s', $timestamp) : null;
        } catch (\Throwable) {
            return null;
        }
    }
}
