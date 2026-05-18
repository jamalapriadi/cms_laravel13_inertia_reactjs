<?php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Model;

class MenuItemTranslation extends Model
{
    protected $fillable = [
        'menu_item_id', // 🔥 ini yang missing
        'locale',
        'title',
        'url',
    ];
}