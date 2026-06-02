<?php

namespace App\Models\Shop;

use App\Models\Unit;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class VariantItem extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'product_id',
        'unit_id',
        'sku',
        'name',
        'image',
        'buying_price',
        'selling_price',
        'track_stock',
        'stock',
        'min_stock_alert',
        'weight',
        'is_active',
    ];

    protected $casts = [
        'buying_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'weight' => 'decimal:2',
        'track_stock' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function options(): BelongsToMany
    {
        return $this->belongsToMany(
            ProductVariantOption::class,
            'variant_item_options',
            'variant_item_id',
            'product_variant_option_id',
        )->with('variant')->withTimestamps();
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'product_variant_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'product_variant_id');
    }

    public function stockUnits(): HasMany
    {
        return $this->hasMany(ProductStockUnit::class, 'product_variant_id');
    }

    public function availableStockUnits(): HasMany
    {
        return $this->hasMany(ProductStockUnit::class, 'product_variant_id')
            ->where('status', 'available');
    }

    public function collectionItems(): HasMany
    {
        return $this->hasMany(ProductCollectionItem::class);
    }

    public function syncStockFromUnits(): void
    {
        $this->forceFill([
            'stock' => $this->availableStockUnits()->count(),
        ])->save();
    }
}
