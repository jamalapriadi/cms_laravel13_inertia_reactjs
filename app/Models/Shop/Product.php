<?php

/*
|--------------------------------------------------------------------------
| app/Models/Product.php
|--------------------------------------------------------------------------
*/

namespace App\Models\Shop;

use App\Models\TermTaxonomy;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;

class Product extends Model
{
    use HasSlug, HasUuids, SoftDeletes;

    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()
            ->generateSlugsFrom('name')
            ->saveSlugsTo('slug')
            ->doNotGenerateSlugsOnUpdate()
            ->startSlugSuffixFrom(2);
    }

    protected $fillable = [
        'category_id',
        'brand_id',
        'unit_id',
        'name',
        'slug',
        'sku',
        'thumbnail',
        'description',
        'short_description',
        'condition',
        'base_price',
        'compare_at_price',
        'cost_price',
        'weight',
        'length',
        'width',
        'height',
        'product_type',
        'status',
        'visibility',
        'is_featured',
        'sort_order',
        'has_variant',
        'meta_title',
        'meta_description',
        'is_publish',
        'created_by',
        'updated_by',
        'wp_id',
        'thumbnail_url',
        'thumbnail_mime_type',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'weight' => 'decimal:2',
        'length' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'is_featured' => 'boolean',
        'sort_order' => 'integer',
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

    public function activeVariantItems(): HasMany
    {
        return $this->hasMany(VariantItem::class)
            ->where('is_active', true);
    }

    public function stockUnits(): HasMany
    {
        return $this->hasMany(ProductStockUnit::class, 'product_id');
    }

    public function availableStockUnits(): HasMany
    {
        return $this->hasMany(ProductStockUnit::class, 'product_id')->where('status', 'available');
    }

    public function frontendAvailableStockUnits(): HasMany
    {
        return $this->hasMany(ProductStockUnit::class, 'product_id')
            ->where('status', 'available')
            ->where(function ($query) {
                $query->whereNull('product_variant_id')
                    ->orWhereHas('variantItem', fn ($variantQuery) => $variantQuery->where('is_active', true));
            });
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function collectionItems(): HasMany
    {
        return $this->hasMany(ProductCollectionItem::class);
    }

    public function tags()
    {
        return $this->belongsToMany(TermTaxonomy::class, 'product_term_taxonomy', 'product_id', 'term_taxonomy_id')
            ->where('taxonomy', 'tags');
    }

    public function getThumbnailFullUrlAttribute(): ?string
    {
        if (! empty($this->thumbnail_url)) {
            return $this->thumbnail_url;
        }

        $value = $this->thumbnail;

        if (! $value) {
            return null;
        }

        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        $baseUrl = rtrim(config('services.idcloudhost.url'), '/');
        if (empty($baseUrl)) {
            return null;
        }

        return $baseUrl.'/'.ltrim($value, '/');
    }
}
