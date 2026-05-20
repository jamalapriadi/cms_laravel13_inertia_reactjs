<?php

/*
|--------------------------------------------------------------------------
| app/Models/Cart.php
|--------------------------------------------------------------------------
*/

namespace App\Models\Shop;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
    ];

    protected $appends = [
        'total_price',
        'total_qty',
    ];

    public function getTotalPriceAttribute(): float
    {
        return (float) $this->items->sum(function ($item) {
            return $item->subtotal;
        });
    }

    public function getTotalQtyAttribute(): int
    {
        return (int) $this->items->sum('qty');
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(CartItem::class);
    }
}
