<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('variant_items')
            ->select('id')
            ->orderBy('id')
            ->chunk(100, function ($variantItems) {
                foreach ($variantItems as $variantItem) {
                    $availableStock = DB::table('product_stock_units')
                        ->where('product_variant_id', $variantItem->id)
                        ->where('status', 'available')
                        ->whereNull('deleted_at')
                        ->count();

                    DB::table('variant_items')
                        ->where('id', $variantItem->id)
                        ->update(['stock' => $availableStock]);
                }
            });
    }

    public function down(): void
    {
        //
    }
};
