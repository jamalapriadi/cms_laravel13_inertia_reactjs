<?php

/*
|--------------------------------------------------------------------------
| app/Models/CartItem.php
|--------------------------------------------------------------------------
*/

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'cart_id',
        'product_id',
        'product_variant_id',
        'qty',
    ];

    protected $appends = [
        'price',
        'subtotal',
    ];

    public function getPriceAttribute(): float
    {
        if ($this->product_variant_id && $this->variant && $this->variant->selling_price !== null) {
            return (float) $this->variant->selling_price;
        }

        return (float) ($this->product->base_price ?? 0);
    }

    public function getSubtotalAttribute(): float
    {
        return $this->price * $this->qty;
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(VariantItem::class, 'product_variant_id');
    }
}
