<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Dashboard\Media;
use App\Services\Dashboard\MediaService;
use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MediaController extends Controller
{
    public function __construct(
        protected MediaService $mediaService
    ) {}

    public function index(Request $request)
    {
        $library = $this->buildStorageLibrary($request);

        return Inertia::render('Dashboard/Media/Index', [
            ...$library,
            'filters' => [
                'search' => $request->query('search'),
                'date' => $request->query('date'),
            ],
        ]);
    }

    public function library(Request $request)
    {
        return response()->json($this->buildStorageLibrary($request));
    }

    private function buildStorageLibrary(Request $request): array
    {
        $path = trim((string) $request->query('path', ''), '/');
        $search = $request->query('search');
        $date = $request->query('date');
        $disk = Storage::disk('public');

        abort_if(str_contains($path, '..'), 404);

        $directories = $search
            ? $disk->allDirectories($path)
            : $disk->directories($path);

        $files = $search
            ? $disk->allFiles($path)
            : $disk->files($path);

        $directories = collect($directories)
            ->reject(fn (string $directory) => $this->isHiddenPath($directory))
            ->filter(fn (string $directory) => ! $search || str_contains(strtolower(basename($directory)), strtolower($search)))
            ->sort()
            ->values()
            ->map(fn (string $directory) => [
                'type' => 'folder',
                'name' => basename($directory),
                'path' => $directory,
                'url' => null,
                'mime_type' => null,
                'size' => null,
                'last_modified' => null,
            ]);

        $files = collect($files)
            ->filter(function (string $file) use ($date, $disk, $search) {
                if ($this->isHiddenPath($file) || ! $this->isAllowedImageFile($file)) {
                    return false;
                }

                if ($search && ! str_contains(strtolower(basename($file)), strtolower($search))) {
                    return false;
                }

                $lastModified = $this->safeLastModified($disk, $file);

                if ($date && (! $lastModified || date('Y-m-d', $lastModified) !== $date)) {
                    return false;
                }

                return true;
            })
            ->sort()
            ->values()
            ->map(function (string $file) use ($disk) {
                $lastModified = $this->safeLastModified($disk, $file);

                return [
                    'type' => 'file',
                    'name' => basename($file),
                    'path' => $file,
                    'url' => Storage::disk('public')->url($file),
                    'mime_type' => $this->safeMimeType($disk, $file),
                    'size' => $this->safeSize($disk, $file),
                    'last_modified' => $lastModified ? date('Y-m-d H:i:s', $lastModified) : null,
                ];
            });

        $storageItems = $directories
            ->concat($files)
            ->values();

        $breadcrumbs = collect($path ? explode('/', $path) : [])
            ->map(function (string $segment, int $index) use ($path) {
                $segments = explode('/', $path);

                return [
                    'name' => $segment,
                    'path' => implode('/', array_slice($segments, 0, $index + 1)),
                ];
            })
            ->values();

        return [
            'storageItems' => $storageItems,
            'currentPath' => $path,
            'breadcrumbs' => $breadcrumbs,
        ];
    }

    public function create(Request $request)
    {
        return Inertia::render('Dashboard/Media/Create');
    }

    public function store(Request $request, MediaService $mediaService)
    {
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $mediaService->upload($request->file('file'), auth()->id());

        return back();
    }

    public function store_json(Request $request, MediaService $mediaService)
    {
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $path = $mediaService->upload(
            $request->file('file'),
            auth()->id()
        );

        return response()->json([
            'location' => MediaPath::url($path->path),
            'url' => MediaPath::url($path->path),
            'media' => $path,
        ]);
    }

    public function update(Request $request, Media $medium)
    {
        $medium->update([
            'alt' => $request->alt,
        ]);

        return back();
    }

    public function destroy(Media $medium)
    {
        // \Storage::disk('public')->delete($medium->path);
        // $medium->delete();

        // return back();

        if ($medium->path && \Storage::disk($medium->disk)->exists($medium->path)) {
            \Storage::disk($medium->disk)->delete($medium->path);
        }

        $medium->delete();

        return back()->with('success', 'Media deleted successfully.');
    }

    public function destroyStorageFile(Request $request)
    {
        $data = $request->validate([
            'path' => ['required', 'string'],
        ]);

        $path = trim($data['path'], '/');

        abort_if(str_contains($path, '..'), 404);
        abort_if(! Storage::disk('public')->exists($path), 404);

        Storage::disk('public')->delete($path);
        Media::query()->where('disk', 'public')->where('path', $path)->delete();

        return back()->with('success', 'File deleted successfully.');
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|image|max:2048',
        ]);

        $media = $this->mediaService->upload(
            $request->file('file'),
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'media' => $media,
            'url' => $media->url(),
        ]);
    }

    public function store_image(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        $path = $request->file('image')->store('posts', 'public');

        return response()->json([
            'url' => Storage::disk('public')->url($path),
        ]);
    }

    private function isHiddenPath(string $path): bool
    {
        return collect(explode('/', trim($path, '/')))
            ->contains(fn (string $segment) => str_starts_with($segment, '.'));
    }

    private function isAllowedImageFile(string $path): bool
    {
        return in_array(strtolower(pathinfo($path, PATHINFO_EXTENSION)), [
            'jpg',
            'jpeg',
            'png',
            'webp',
            'gif',
            'svg',
        ], true);
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

    private function safeLastModified($disk, string $path): ?int
    {
        try {
            return $disk->lastModified($path) ?: null;
        } catch (\Throwable) {
            return null;
        }
    }
}
