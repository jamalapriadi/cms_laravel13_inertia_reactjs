<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProductVariantOption extends Model
{
    use HasUuids;

    protected $fillable = [
        'product_variant_id',
        'value',
        'sort_order',
    ];

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function variantItems(): BelongsToMany
    {
        return $this->belongsToMany(
            VariantItem::class,
            'variant_item_options',
            'product_variant_option_id',
            'variant_item_id',
        )->withTimestamps();
    }
}
