<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductStockUnit extends Model
{
    use HasUuids, SoftDeletes;

    public const NETWORKS = [
        'sim_free',
        'docomo',
        'au',
        'softbank',
        'rakuten',
        'mineo',
    ];

    protected $fillable = [
        'product_variant_id',
        'incoming_goods_item_id',
        'imei_serial_number',
        'network_compatibility',
        'status',
        'note',
    ];

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function incomingGoodsItem()
    {
        return $this->belongsTo(IncomingGoodsItem::class, 'incoming_goods_item_id');
    }

    public function product()
    {
        return $this->hasOneThrough(
            Product::class,
            ProductVariant::class,
            'id',
            'id',
            'product_variant_id',
            'product_id',
        );
    }
}
