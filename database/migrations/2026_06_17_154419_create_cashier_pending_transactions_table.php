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
        Schema::create('cashier_pending_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('cashier_session_id')->constrained('cashier_sessions')->cascadeOnDelete();
            $table->foreignId('cashier_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('name')->nullable();
            $table->string('status')->default('pending'); // pending, converted, cancelled, expired
            $table->decimal('subtotal', 15, 2);
            $table->string('discount_type')->nullable(); // nominal, percentage
            $table->decimal('discount_value', 15, 2)->nullable();
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2);
            $table->text('note')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->foreignUuid('converted_order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->timestamp('converted_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cashier_pending_transactions');
    }
};
