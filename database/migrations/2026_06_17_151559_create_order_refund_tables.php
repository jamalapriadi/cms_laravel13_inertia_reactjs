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
        Schema::create('order_refunds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id')->index();
            $table->unsignedBigInteger('cashier_session_id')->nullable()->index();
            $table->uuid('processed_by')->nullable()->index();
            $table->string('type'); // cancel, full_refund, partial_refund
            $table->string('refund_status')->default('completed');
            $table->decimal('refund_amount', 15, 2)->default(0);
            $table->string('reason')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
        });

        Schema::create('order_refund_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_refund_id')->index();
            $table->uuid('order_id')->index();
            $table->uuid('order_item_id')->index();
            $table->uuid('product_id')->nullable();
            $table->uuid('variant_item_id')->nullable();
            $table->uuid('stock_unit_id')->nullable();
            
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->foreign('order_refund_id')->references('id')->on('order_refunds')->cascadeOnDelete();
            $table->foreign('order_item_id')->references('id')->on('order_items')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_refund_items');
        Schema::dropIfExists('order_refunds');
    }
};
