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
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('cancelled_at')->nullable()->after('paid_at');
            $table->uuid('cancelled_by')->nullable()->after('cancelled_at');
            $table->timestamp('refunded_at')->nullable()->after('cancelled_by');
            $table->uuid('refunded_by')->nullable()->after('refunded_at');
            $table->decimal('refund_total', 15, 2)->default(0)->after('refunded_by');
            $table->string('refund_reason')->nullable()->after('refund_total');
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled', 'refunded', 'partially_refunded') DEFAULT 'pending'");
            DB::statement("ALTER TABLE orders MODIFY COLUMN payment_status ENUM('pending', 'paid', 'failed', 'expired', 'refunded', 'partially_refunded', 'cancelled') DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'cancelled_at',
                'cancelled_by',
                'refunded_at',
                'refunded_by',
                'refund_total',
                'refund_reason',
            ]);
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled') DEFAULT 'pending'");
            DB::statement("ALTER TABLE orders MODIFY COLUMN payment_status ENUM('pending', 'paid', 'failed', 'expired', 'refunded') DEFAULT 'pending'");
        }
    }
};
