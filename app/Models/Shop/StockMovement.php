<?php

/*
|--------------------------------------------------------------------------
| app/Models/StockMovement.php
|--------------------------------------------------------------------------
*/

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StockMovement extends Model
{
    use HasUuids;

    protected $fillable = [
        'product_variant_id',
        'type',
        'qty',
        'stock_before',
        'stock_after',
        'note',
        'created_by',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}