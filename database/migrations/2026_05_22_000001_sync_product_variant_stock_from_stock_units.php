<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('product_variants')
            ->select('id')
            ->orderBy('id')
            ->chunk(100, function ($variants) {
                foreach ($variants as $variant) {
                    $availableStock = DB::table('product_stock_units')
                        ->where('product_variant_id', $variant->id)
                        ->where('status', 'available')
                        ->whereNull('deleted_at')
                        ->count();

                    DB::table('product_variants')
                        ->where('id', $variant->id)
                        ->update(['stock' => $availableStock]);
                }
            });
    }

    public function down(): void
    {
        //
    }
};
