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
        Schema::table('cashier_sessions', function (Blueprint $table) {
            $table->decimal('cash_in_total', 15, 2)->default(0)->after('difference');
            $table->decimal('cash_out_total', 15, 2)->default(0)->after('cash_in_total');
            $table->decimal('expense_total', 15, 2)->default(0)->after('cash_out_total');
            $table->decimal('owner_withdrawal_total', 15, 2)->default(0)->after('expense_total');
            $table->decimal('adjustment_total', 15, 2)->default(0)->after('owner_withdrawal_total');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cashier_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'cash_in_total',
                'cash_out_total',
                'expense_total',
                'owner_withdrawal_total',
                'adjustment_total',
            ]);
        });
    }
};
