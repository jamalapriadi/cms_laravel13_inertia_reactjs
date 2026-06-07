<?php

namespace App\Models;

use App\Models\Dashboard\Language;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageTranslation extends Model
{
    protected $fillable = [
        'page_id',
        'language_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'status',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }
}
