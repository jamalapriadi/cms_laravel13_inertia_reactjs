<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class IncomingGoodsItem extends Model
{
    use HasUuids;

    protected $table = 'incoming_goods_items';

    protected $fillable = [
        'incoming_goods_id',
        'product_id',
        'product_variant_id',
        'qty',
        'cost_price',
        'subtotal',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'qty' => 'integer',
    ];

    public function incomingGoods()
    {
        return $this->belongsTo(IncomingGoods::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function stockUnits()
    {
        return $this->hasMany(ProductStockUnit::class, 'incoming_goods_item_id');
    }
}
