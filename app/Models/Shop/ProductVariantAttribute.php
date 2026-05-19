<?php

/*
|--------------------------------------------------------------------------
| app/Models/ProductVariantAttribute.php
|--------------------------------------------------------------------------
*/

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProductVariantAttribute extends Model
{
    use HasUuids;

    protected $fillable = [
        'variant_id',
        'attribute_name',
        'attribute_value',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}