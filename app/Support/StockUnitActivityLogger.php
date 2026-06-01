<?php

namespace App\Support;

use App\Models\Shop\ProductStockUnit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class StockUnitActivityLogger
{
    /**
     * @param array<string, mixed> $metadata
     */
    public static function log(
        ProductStockUnit $stockUnit,
        string $action,
        ?string $description = null,
        ?string $oldStatus = null,
        ?string $newStatus = null,
        array $metadata = [],
    ): void {
        if (! Schema::hasTable('stock_unit_activities')) {
            return;
        }

        DB::table('stock_unit_activities')->insert([
            'id' => (string) Str::uuid(),
            'product_stock_unit_id' => $stockUnit->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'description' => $description,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'metadata' => empty($metadata) ? null : json_encode($metadata),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
