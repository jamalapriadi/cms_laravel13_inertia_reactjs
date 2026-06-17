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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_source')->default('frontend')->after('invoice_number')->index();
            $table->unsignedBigInteger('cashier_id')->nullable()->after('customer_id')->index();

            $table->string('payment_method')->nullable()->after('grand_total');
            $table->decimal('amount_paid', 15, 2)->default(0)->after('payment_method');
            $table->decimal('change_amount', 15, 2)->default(0)->after('amount_paid');
            $table->text('payment_note')->nullable()->after('change_amount');

            $table->foreign('cashier_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['cashier_id']);
            $table->dropColumn([
                'order_source',
                'cashier_id',
                'payment_method',
                'amount_paid',
                'change_amount',
                'payment_note',
            ]);
        });
    }
};
