<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->uuid('product_stock_unit_id')->nullable()->after('product_variant_id');
            $table->string('stock_unit_status_before')->nullable()->after('stock_after');
            $table->string('stock_unit_status_after')->nullable()->after('stock_unit_status_before');

            $table->foreign('product_stock_unit_id')
                ->references('id')
                ->on('product_stock_units')
                ->nullOnDelete();

            $table->index('product_stock_unit_id');
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['product_stock_unit_id']);
            $table->dropIndex(['product_stock_unit_id']);
            $table->dropColumn([
                'product_stock_unit_id',
                'stock_unit_status_before',
                'stock_unit_status_after',
            ]);
        });
    }
};
