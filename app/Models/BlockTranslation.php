<?php

namespace App\Models;

use App\Models\Dashboard\Language;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockTranslation extends Model
{
    protected $fillable = [
        'block_id',
        'language_id',
        'props',
    ];

    protected $casts = [
        'props' => 'array',
    ];

    public function block(): BelongsTo
    {
        return $this->belongsTo(Block::class);
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }
}
