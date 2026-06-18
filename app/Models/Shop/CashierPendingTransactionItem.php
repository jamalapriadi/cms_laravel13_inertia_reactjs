<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashierPendingTransactionItem extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'original_unit_price' => 'decimal:2',
            'final_unit_price' => 'decimal:2',
            'is_price_overridden' => 'boolean',
            'meta' => 'array',
        ];
    }

    public function pendingTransaction()
    {
        return $this->belongsTo(CashierPendingTransaction::class, 'cashier_pending_transaction_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variantItem()
    {
        return $this->belongsTo(VariantItem::class);
    }

    public function stockUnit()
    {
        return $this->belongsTo(ProductStockUnit::class, 'stock_unit_id');
    }
}
