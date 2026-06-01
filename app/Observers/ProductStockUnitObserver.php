<?php

namespace App\Observers;

use App\Models\Shop\VariantItem;
use App\Models\Shop\ProductStockUnit;
use App\Services\Inventory\BarcodeGeneratorService;

class ProductStockUnitObserver
{
    public function creating(ProductStockUnit $productStockUnit): void
    {
        if (! $productStockUnit->product_id && $productStockUnit->product_variant_id) {
            $variant = VariantItem::query()->find($productStockUnit->product_variant_id);

            if ($variant) {
                $productStockUnit->product_id = $variant->product_id;
            }
        }
    }

    public function created(ProductStockUnit $productStockUnit): void
    {
        if ($productStockUnit->barcode) {
            return;
        }

        app(BarcodeGeneratorService::class)->ensureBarcode($productStockUnit);
    }
}
