<?php

// app/Models/PostCategory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PostCategory extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'category_name',
        'slug',
        'description',
        'parent_id',
        'featured_image',
    ];

    public function parent()
    {
        return $this->belongsTo(PostCategory::class, 'parent_id');
    }
}
