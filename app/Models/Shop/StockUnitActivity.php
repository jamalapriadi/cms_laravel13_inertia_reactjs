<?php

namespace App\Models\Shop;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StockUnitActivity extends Model
{
    use HasUuids;

    protected $fillable = [
        'product_stock_unit_id',
        'user_id',
        'action',
        'description',
        'old_status',
        'new_status',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function stockUnit()
    {
        return $this->belongsTo(ProductStockUnit::class, 'product_stock_unit_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
