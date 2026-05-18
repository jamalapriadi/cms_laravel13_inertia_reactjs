<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'content',
        'type',
        'status',
        'parent_id',
        'mime_type',
        'comment_status',
        'published_at',
    ];

    protected $casts = [
        'comment_status' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function metas()
    {
        return $this->hasMany(PostMeta::class);
    }

    public function featuredImage()
    {
        return $this->hasOne(PostMeta::class)
            ->where('meta_key', 'featured_image');
    }

    public function taxonomies()
    {
        return $this->belongsToMany(
            TermTaxonomy::class,
            'term_relationships'
        )->withTimestamps();
    }

    public function categories()
    {
        return $this->taxonomies()->where('taxonomy', 'categories');
    }

    public function tags()
    {
        return $this->taxonomies()->where('taxonomy', 'tags');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Post.php
    public function blocks()
    {
        return $this->hasMany(Block::class)->orderBy('order');
    }
}