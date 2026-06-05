<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Drop the old foreign key constraint
        Schema::table('product_stock_units', function (Blueprint $table) {
            $table->dropForeign(['product_variant_id']);
        });

        // 2. Add product_id column as nullable and make product_variant_id nullable
        Schema::table('product_stock_units', function (Blueprint $table) {
            $table->uuid('product_id')->nullable()->after('id');
            $table->uuid('product_variant_id')->nullable()->change();
        });

        // 3. Backfill product_id for existing stock units
        DB::table('product_stock_units')
            ->whereNotNull('product_variant_id')
            ->update([
                'product_id' => DB::raw(
                    '(select product_id from variant_items where variant_items.id = product_stock_units.product_variant_id)'
                ),
            ]);

        // 4. Set product_id to NOT NULL
        Schema::table('product_stock_units', function (Blueprint $table) {
            $table->uuid('product_id')->nullable(false)->change();
        });

        // 5. Restore foreign keys with proper configurations and add index
        Schema::table('product_stock_units', function (Blueprint $table) {
            $table->foreign('product_variant_id')
                ->references('id')
                ->on('variant_items')
                ->nullOnDelete();

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->cascadeOnDelete();

            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_stock_units', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropForeign(['product_variant_id']);
        });

        // Delete stock units without variant before making the column NOT NULL to avoid crash
        DB::table('product_stock_units')->whereNull('product_variant_id')->delete();

        Schema::table('product_stock_units', function (Blueprint $table) {
            $table->uuid('product_variant_id')->nullable(false)->change();
        });

        Schema::table('product_stock_units', function (Blueprint $table) {
            $table->foreign('product_variant_id')
                ->references('id')
                ->on('variant_items')
                ->cascadeOnDelete();

            $table->dropColumn('product_id');
        });
    }
};
