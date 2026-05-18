<?php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'model_type',
        'model_id',
        'uuid',
        'collection_name',
        'name',
        'file_name',
        'mime_type',
        'width',
        'height',
        'orientation',
        'path',
        'disk',
        'size',
        'alt',
        'custom_properties',
    ];

    protected $casts = [
        'custom_properties' => 'array',
    ];

    public function model()
    {
        return $this->morphTo();
    }

    public function getUrlAttribute()
    {
        return asset('storage/' . $this->path);
    }

    public function url()
    {
        return Storage::disk($this->disk)->url($this->path);
    }
    
}
