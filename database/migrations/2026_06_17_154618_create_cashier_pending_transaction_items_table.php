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
        Schema::create('cashier_pending_transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('cashier_pending_transaction_id')
                ->constrained('cashier_pending_transactions', 'id', 'cash_pending_tx_items_tx_id_foreign')
                ->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('variant_item_id')->nullable()->constrained('variant_items')->nullOnDelete();
            $table->foreignUuid('stock_unit_id')->nullable()->constrained('product_stock_units')->nullOnDelete();
            $table->string('name');
            $table->string('variant_label')->nullable();
            $table->string('sku')->nullable();
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cashier_pending_transaction_items');
    }
};
