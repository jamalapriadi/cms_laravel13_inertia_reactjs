<?php

namespace App\Services\Dashboard;

use App\Models\Dashboard\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class MediaService
{
    protected $imageManager;

    public function __construct()
    {
        $this->imageManager = new ImageManager(new Driver);
    }

    public function index(Request $request)
    {
        $query = Media::query();

        if ($request->search) {
            $query->where('file_name', 'like', '%'.$request->search.'%');
        }

        $media = $query->latest()
            ->paginate(24);

        return response()->json($media);
    }

    public function upload($file, $userId = null)
    {
        $uuid = Str::uuid();
        $folder = 'media/'.date('Y/m');

        $extension = strtolower($file->getClientOriginalExtension());
        $filename = $uuid.'.'.$extension;

        $path = $file->storeAs($folder, $filename, 'public');

        $width = null;
        $height = null;
        $size = $file->getSize();

        // Convert supported raster images to webp. Keep ico/svg as-is.
        $uploadedMimeType = $file->getMimeType();

        if (in_array($uploadedMimeType, [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/x-webp',
            'image/bmp',
            'image/avif',
        ], true) || $extension === 'webp') {

            $image = $this->imageManager->decodePath($file->getRealPath());

            $width = $image->width();
            $height = $image->height();

            $webpName = $uuid.'.webp';
            $webpPath = $folder.'/'.$webpName;
            $encodedWebp = (string) $image->encodeUsingFileExtension('webp', quality: 80);

            Storage::disk('public')->put($webpPath, $encodedWebp);

            Storage::disk('public')->delete($path);

            $path = $webpPath;
            $filename = $webpName;
            $size = strlen($encodedWebp);
        }

        $mimeType = $path === ($webpPath ?? null)
            ? 'image/webp'
            : $uploadedMimeType;

        return Media::create([
            'user_id' => $userId,
            'uuid' => $uuid,
            'file_name' => $filename,
            'mime_type' => $mimeType,
            'path' => $path,
            'disk' => 'public',
            'size' => $size,
            'width' => $width,
            'height' => $height,
        ]);
    }
}
