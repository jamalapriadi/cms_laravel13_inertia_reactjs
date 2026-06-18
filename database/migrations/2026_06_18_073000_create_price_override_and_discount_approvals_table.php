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
        // 1. Add fields to order_items
        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('original_unit_price', 15, 2)->nullable()->after('price');
            $table->decimal('final_unit_price', 15, 2)->nullable()->after('original_unit_price');
            $table->decimal('price_override_amount', 15, 2)->default(0)->after('final_unit_price');
            $table->boolean('is_price_overridden')->default(false)->after('price_override_amount');
            $table->foreignId('price_overridden_by')->nullable()->constrained('users')->nullOnDelete()->after('is_price_overridden');
            $table->text('price_override_reason')->nullable()->after('price_overridden_by');
            $table->timestamp('price_overridden_at')->nullable()->after('price_override_reason');
        });

        // 2. Add fields to orders
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('item_discount_total', 15, 2)->default(0)->after('discount');
            $table->decimal('order_discount_total', 15, 2)->default(0)->after('item_discount_total');
            $table->decimal('price_override_total', 15, 2)->default(0)->after('order_discount_total');
            $table->string('discount_approval_status')->nullable()->index()->after('price_override_total');
            $table->foreignId('discount_approved_by')->nullable()->constrained('users')->nullOnDelete()->after('discount_approval_status');
            $table->timestamp('discount_approved_at')->nullable()->after('discount_approved_by');
            $table->text('discount_approval_note')->nullable()->after('discount_approved_at');
        });

        // 3. Create order_discount_approvals table
        Schema::create('order_discount_approvals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->foreignId('cashier_session_id')->nullable()->constrained('cashier_sessions')->nullOnDelete();
            $table->foreignId('cashier_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('approval_type'); // order_discount, item_discount, price_override
            $table->string('status')->default('pending')->index(); // pending, approved, rejected, cancelled
            $table->string('discount_type')->nullable(); // nominal, percentage
            $table->decimal('discount_value', 15, 2)->nullable();
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('discount_percentage', 5, 2)->nullable();
            $table->decimal('subtotal_before_discount', 15, 2);
            $table->decimal('grand_total_after_discount', 15, 2);
            $table->text('reason');
            $table->text('approval_note')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->json('items_snapshot')->nullable();
            $table->json('pricing_snapshot')->nullable();
            $table->timestamps();
        });

        // 4. Add fields to cashier_pending_transactions and items
        Schema::table('cashier_pending_transaction_items', function (Blueprint $table) {
            $table->decimal('original_unit_price', 15, 2)->nullable()->after('unit_price');
            $table->decimal('final_unit_price', 15, 2)->nullable()->after('original_unit_price');
            $table->boolean('is_price_overridden')->default(false)->after('final_unit_price');
            $table->text('price_override_reason')->nullable()->after('is_price_overridden');
        });

        Schema::table('cashier_pending_transactions', function (Blueprint $table) {
            $table->foreignUuid('discount_approval_id')->nullable()->constrained('order_discount_approvals')->nullOnDelete()->after('discount_amount');
            $table->string('discount_approval_status')->nullable()->after('discount_approval_id');
            $table->decimal('price_override_total', 15, 2)->default(0)->after('discount_approval_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cashier_pending_transactions', function (Blueprint $table) {
            $table->dropForeign(['discount_approval_id']);
            $table->dropColumn(['discount_approval_id', 'discount_approval_status', 'price_override_total']);
        });

        Schema::table('cashier_pending_transaction_items', function (Blueprint $table) {
            $table->dropColumn(['original_unit_price', 'final_unit_price', 'is_price_overridden', 'price_override_reason']);
        });

        Schema::dropIfExists('order_discount_approvals');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['discount_approved_by']);
            $table->dropColumn([
                'item_discount_total',
                'order_discount_total',
                'price_override_total',
                'discount_approval_status',
                'discount_approved_by',
                'discount_approved_at',
                'discount_approval_note',
            ]);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['price_overridden_by']);
            $table->dropColumn([
                'original_unit_price',
                'final_unit_price',
                'price_override_amount',
                'is_price_overridden',
                'price_overridden_by',
                'price_override_reason',
                'price_overridden_at',
            ]);
        });
    }
};
