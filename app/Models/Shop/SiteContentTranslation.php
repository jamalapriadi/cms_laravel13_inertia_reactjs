<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteContentTranslation extends Model
{
    use HasUuids;

    protected $fillable = [
        'site_content_id',
        'locale',
        'value',
    ];

    public function siteContent(): BelongsTo
    {
        return $this->belongsTo(SiteContent::class);
    }
}
