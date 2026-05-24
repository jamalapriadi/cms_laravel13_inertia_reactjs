<?php

/*
|--------------------------------------------------------------------------
| app/Models/ProductVariant.php
|--------------------------------------------------------------------------
*/

namespace App\Models\Shop;

use App\Models\Unit;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'product_id',
        'unit_id',
        'name',
        'color',
        'storage',
        'sku',
        'image',
        'price',
        'track_stock',
        'stock',
        'min_stock_alert',
        'weight',
        'cost_price',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'weight' => 'decimal:2',
        'track_stock' => 'boolean',
        'is_active' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function attributes()
    {
        return $this->hasMany(ProductVariantAttribute::class, 'variant_id');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'product_variant_id');
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function stockUnits()
    {
        return $this->hasMany(ProductStockUnit::class, 'product_variant_id');
    }

    public function availableStockUnits()
    {
        return $this->hasMany(ProductStockUnit::class, 'product_variant_id')
            ->where('status', 'available');
    }

    public function syncStockFromUnits(): void
    {
        $this->forceFill([
            'stock' => $this->availableStockUnits()->count(),
        ])->save();
    }
}
