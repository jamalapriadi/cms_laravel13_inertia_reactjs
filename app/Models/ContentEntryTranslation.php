<?php

namespace App\Models;

use App\Models\Dashboard\Language;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentEntryTranslation extends Model
{
    use HasUuids;

    protected $fillable = [
        'content_entry_id',
        'language_id',
        'title',
        'slug',
        'excerpt',
        'status',
        'published_at',
        'data',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'data' => 'array',
    ];

    public function contentEntry(): BelongsTo
    {
        return $this->belongsTo(ContentEntry::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }
}
