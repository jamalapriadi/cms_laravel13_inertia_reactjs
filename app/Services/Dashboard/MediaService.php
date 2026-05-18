<?php 
namespace App\Services\Dashboard;

use App\Models\Dashboard\Media;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Http\Request;
class MediaService
{
    protected $imageManager;

    public function __construct()
    {
        $this->imageManager = new ImageManager(new Driver());
    }

    public function index(Request $request)
    {
        $query = Media::query();

        if($request->search){
            $query->where('file_name','like','%'.$request->search.'%');
        }

        $media = $query->latest()
            ->paginate(24);

        return response()->json($media);
    }

    public function upload($file, $userId = null)
    {
        $uuid = Str::uuid();
        $folder = 'media/' . date('Y/m');

        $extension = $file->getClientOriginalExtension();
        $filename = $uuid . '.' . $extension;

        $path = $file->storeAs($folder, $filename, 'public');

        $width = null;
        $height = null;

        // Jika gambar → convert ke webp
        if (str_contains($file->getMimeType(), 'image')) {

            $image = $this->imageManager->read($file->getRealPath());

            $width = $image->width();
            $height = $image->height();

            $webpName = $uuid . '.webp';
            $webpPath = $folder . '/' . $webpName;

            $image->toWebp(80)->save(storage_path('app/public/' . $webpPath));

            Storage::disk('public')->delete($path);

            $path = $webpPath;
            $filename = $webpName;
        }

        return Media::create([
            'user_id' => $userId,
            'uuid' => $uuid,
            'file_name' => $filename,
            'mime_type' => $file->getMimeType(),
            'path' => $path,
            'disk' => 'public',
            'size' => $file->getSize(),
            'width' => $width,
            'height' => $height,
        ]);
    }
}