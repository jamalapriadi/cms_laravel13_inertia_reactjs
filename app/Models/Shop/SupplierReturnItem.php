<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SupplierReturnItem extends Model
{
    use HasUuids;

    protected $table = 'supplier_return_items';

    protected $fillable = [
        'supplier_return_id',
        'product_stock_unit_id',
        'notes',
    ];

    public function supplierReturn()
    {
        return $this->belongsTo(SupplierReturn::class);
    }

    public function stockUnit()
    {
        return $this->belongsTo(ProductStockUnit::class, 'product_stock_unit_id');
    }
}
