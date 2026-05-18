<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Dashboard\Media;
use App\Services\Dashboard\MediaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MediaController extends Controller
{
    public function __construct(
        protected MediaService $mediaService
    ) {}

    public function index(Request $request)
    {
        $query = Media::query();

        if ($request->search) {
            $query->where('file_name', 'like', "%{$request->search}%");
        }

        if ($request->date) {
            $query->whereDate('created_at', $request->date);
        }

        $media = $query->latest()->paginate(20)->withQueryString();

        return Inertia::render('Dashboard/Media/Index', [
            'media' => $media,
            'filters' => $request->only('search', 'date'),
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

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|image|max:2048'
        ]);

        $media = $this->mediaService->upload(
            $request->file('file'),
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'media' => $media,
            'url' => $media->url()
        ]);
    }

    public function store_image(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:2048'
        ]);

        $path = $request->file('image')->store('posts', 'public');

        return response()->json([
            'url' => asset('storage/' . $path)
        ]);
    }
}