<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OrderRefundItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'order_refund_id',
        'order_id',
        'order_item_id',
        'product_id',
        'variant_item_id',
        'stock_unit_id',
        'quantity',
        'unit_price',
        'subtotal',
        'reason',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function refund()
    {
        return $this->belongsTo(OrderRefund::class, 'order_refund_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variantItem()
    {
        return $this->belongsTo(VariantItem::class, 'variant_item_id');
    }

    public function stockUnit()
    {
        return $this->belongsTo(ProductStockUnit::class, 'stock_unit_id');
    }
}
