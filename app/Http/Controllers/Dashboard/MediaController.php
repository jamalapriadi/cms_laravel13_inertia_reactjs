<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Dashboard\Media;
use App\Services\Dashboard\MediaService;
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
                if ($search && ! str_contains(strtolower(basename($file)), strtolower($search))) {
                    return false;
                }

                if ($date && date('Y-m-d', $disk->lastModified($file)) !== $date) {
                    return false;
                }

                return true;
            })
            ->sort()
            ->values()
            ->map(fn (string $file) => [
                'type' => 'file',
                'name' => basename($file),
                'path' => $file,
                'url' => Storage::url($file),
                'mime_type' => $disk->mimeType($file),
                'size' => $disk->size($file),
                'last_modified' => date('Y-m-d H:i:s', $disk->lastModified($file)),
            ]);

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

        return Inertia::render('Dashboard/Media/Index', [
            'storageItems' => $storageItems,
            'currentPath' => $path,
            'breadcrumbs' => $breadcrumbs,
            'filters' => [
                'search' => $search,
                'date' => $date,
            ],
        ]);
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
            'location' => asset('storage/'.$path->path),
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
            'url' => asset('storage/'.$path),
        ]);
    }
}
