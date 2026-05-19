<?php

/*
|--------------------------------------------------------------------------
| app/Models/ProductSpecification.php
|--------------------------------------------------------------------------
*/

namespace App\Models\Shop;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProductSpecification extends Model
{
    use HasUuids;

    protected $fillable = [
        'product_id',
        'spec_name',
        'spec_value',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}