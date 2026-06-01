<?php

/*
|--------------------------------------------------------------------------
| app/Models/Product.php
|--------------------------------------------------------------------------
*/

namespace App\Models\Shop;

use App\Models\Unit;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'category_id',
        'brand_id',
        'unit_id',
        'name',
        'slug',
        'sku',
        'thumbnail',
        'description',
        'condition',
        'base_price',
        'has_variant',
        'meta_title',
        'meta_description',
        'is_publish',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'has_variant' => 'boolean',
        'is_publish' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function specifications()
    {
        return $this->hasMany(ProductSpecification::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function variantItems(): HasMany
    {
        return $this->hasMany(VariantItem::class);
    }

    public function stockUnits(): HasMany
    {
        return $this->hasMany(ProductStockUnit::class, 'product_id');
    }

    public function availableStockUnits(): HasMany
    {
        return $this->hasMany(ProductStockUnit::class, 'product_id')->where('status', 'available');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}
