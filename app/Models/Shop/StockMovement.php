<?php

/*
|--------------------------------------------------------------------------
| app/Models/StockMovement.php
|--------------------------------------------------------------------------
*/

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasUuids;

    protected $fillable = [
        'product_variant_id',
        'product_stock_unit_id',
        'type',
        'qty',
        'stock_before',
        'stock_after',
        'stock_unit_status_before',
        'stock_unit_status_after',
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
        return $this->belongsTo(VariantItem::class, 'product_variant_id');
    }

    public function stockUnit()
    {
        return $this->belongsTo(ProductStockUnit::class, 'product_stock_unit_id');
    }
}
