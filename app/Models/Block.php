<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Block extends Model
{
    protected $fillable = [
        'post_id',
        'parent_id',
        'type',
        'props',
        'styles',
        'order'
    ];

    protected $casts = [
        'props' => 'array',
        'styles' => 'array',
    ];

    public function children()
    {
        return $this->hasMany(Block::class, 'parent_id')->orderBy('order');
    }

    public function parent()
    {
        return $this->belongsTo(Block::class, 'parent_id');
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}