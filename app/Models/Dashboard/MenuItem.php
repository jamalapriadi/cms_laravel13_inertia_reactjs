<?php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    protected $fillable = [
        'menu_id','parent_id','title','url','type',
        'order','target','icon','meta'
    ];

    protected $casts = [
        'meta' => 'array'
    ];

    public function children()
    {
        return $this->hasMany(MenuItem::class, 'parent_id')
            ->orderBy('order');
    }

    public function translations()
    {
        return $this->hasMany(MenuItemTranslation::class);
    }

    public function translation($locale = null)
    {
        $locale = $locale ?? app()->getLocale();

        return $this->translations->firstWhere('locale', $locale);
    }
}
