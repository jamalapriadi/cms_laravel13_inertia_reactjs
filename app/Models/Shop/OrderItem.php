<?php

/*
|--------------------------------------------------------------------------
| app/Models/OrderItem.php
|--------------------------------------------------------------------------
*/

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'order_id',
        'product_id',
        'product_variant_id',
        'product_name',
        'variant_name',
        'price',
        'qty',
        'subtotal',
        'original_unit_price',
        'final_unit_price',
        'price_override_amount',
        'is_price_overridden',
        'price_overridden_by',
        'price_override_reason',
        'price_overridden_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'original_unit_price' => 'decimal:2',
        'final_unit_price' => 'decimal:2',
        'price_override_amount' => 'decimal:2',
        'is_price_overridden' => 'boolean',
        'price_overridden_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(VariantItem::class, 'product_variant_id');
    }

    public function priceOverriddenBy()
    {
        return $this->belongsTo(User::class, 'price_overridden_by');
    }
}
