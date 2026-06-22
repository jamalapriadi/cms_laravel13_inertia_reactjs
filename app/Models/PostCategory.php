<?php

// app/Models/PostCategory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;

class PostCategory extends Model
{
    use HasSlug, HasUuids;

    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()
            ->generateSlugsFrom('category_name')
            ->saveSlugsTo('slug')
            ->doNotGenerateSlugsOnUpdate()
            ->startSlugSuffixFrom(2);
    }

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
