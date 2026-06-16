<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductStockUnit extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'product_id',
        'product_variant_id',
        'reserved_order_id',
        'reserved_at',
        'incoming_goods_item_id',
        'imei_serial_number',
        'barcode',
        'status',
        'note',
    ];

    protected $casts = [
        'reserved_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function variant()
    {
        return $this->belongsTo(VariantItem::class, 'product_variant_id');
    }

    public function variantItem()
    {
        return $this->belongsTo(VariantItem::class, 'product_variant_id');
    }

    public function incomingGoodsItem()
    {
        return $this->belongsTo(IncomingGoodsItem::class, 'incoming_goods_item_id');
    }

    public function reservedOrder()
    {
        return $this->belongsTo(Order::class, 'reserved_order_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(StockUnitActivity::class, 'product_stock_unit_id');
    }
}
