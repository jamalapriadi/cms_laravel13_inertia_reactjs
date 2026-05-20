<?php

/*
|--------------------------------------------------------------------------
| app/Models/Shop/Shipping.php
|--------------------------------------------------------------------------
*/

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Shipping extends Model
{
    use HasUuids;

    protected $fillable = [
        'order_id',
        'courier',
        'tracking_number',
        'status',
        'shipping_cost',
        'shipping_address',
        'shipped_at',
        'delivered_at',
    ];

    protected $casts = [
        'shipping_cost' => 'decimal:2',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    |
    */

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
