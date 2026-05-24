<?php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItemTranslation extends Model
{
    protected $fillable = [
        'menu_item_id',
        'locale',
        'title',
        'url',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'menu_item_id');
    }
}
