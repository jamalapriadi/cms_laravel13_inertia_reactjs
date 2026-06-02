<?php

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductCollectionItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'product_collection_id',
        'product_id',
        'variant_item_id',
        'sort_order',
    ];

    public function collection(): BelongsTo
    {
        return $this->belongsTo(ProductCollection::class, 'product_collection_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variantItem(): BelongsTo
    {
        return $this->belongsTo(VariantItem::class);
    }
}
