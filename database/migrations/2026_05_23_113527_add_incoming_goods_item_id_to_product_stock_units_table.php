<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('product_stock_units', function (Blueprint $table) {
            $table->uuid('incoming_goods_item_id')->nullable()->after('product_variant_id');

            $table->foreign('incoming_goods_item_id')
                ->references('id')
                ->on('incoming_goods_items')
                ->onDelete('set null');

            $table->index('incoming_goods_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_stock_units', function (Blueprint $table) {
            $table->dropForeign(['incoming_goods_item_id']);
            $table->dropIndex(['incoming_goods_item_id']);
            $table->dropColumn('incoming_goods_item_id');
        });
    }
};
