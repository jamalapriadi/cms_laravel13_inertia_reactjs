<?php

namespace App\Services;

use App\Support\MediaPath;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class MediaUploadService
{
    protected ImageManager $imageManager;

    /**
     * Create a new MediaUploadService instance.
     */
    public function __construct()
    {
        $this->imageManager = new ImageManager(new Driver);
    }

    /**
     * Upload an image to the IDCloudHost Object Storage.
     * Converts raster images to webp.
     */
    public function uploadImage(UploadedFile $file, string $directory = 'media'): string
    {
        $uuid = Str::uuid();
        $extension = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getMimeType();

        $shouldConvertToWebp = in_array($mimeType, [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/x-webp',
            'image/bmp',
            'image/avif',
        ], true) || $extension === 'webp';

        if ($shouldConvertToWebp) {
            $image = $this->imageManager->decodePath($file->getRealPath());
            $encodedWebp = (string) $image->encodeUsingFileExtension('webp', quality: 80);
            $path = rtrim($directory, '/').'/'.$uuid.'.webp';
            Storage::disk('idcloudhost')->put($path, $encodedWebp);

            return $path;
        }

        $filename = $uuid.'.'.$extension;
        $storedPath = $file->storeAs($directory, $filename, 'idcloudhost');

        return $storedPath ?: '';
    }

    public function delete(?string $path): bool
    {
        if (! $path) {
            return false;
        }

        $deleted = false;

        try {
            if (Storage::disk('public')->exists($path)) {
                $deleted = Storage::disk('public')->delete($path) || $deleted;
            }
        } catch (\Throwable) {
            // Ignore public disk exceptions
        }

        try {
            if (Storage::disk('idcloudhost')->exists($path)) {
                $deleted = Storage::disk('idcloudhost')->delete($path) || $deleted;
            }
        } catch (\Throwable) {
            // Ignore S3 / idcloudhost disk exceptions
        }

        return $deleted;
    }

    /**
     * Resolve absolute URL for the given path.
     */
    public function url(?string $path): ?string
    {
        return MediaPath::url($path);
    }
}
