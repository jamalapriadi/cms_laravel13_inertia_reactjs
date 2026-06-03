<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table): void {
            if (! Schema::hasColumn('carts', 'status')) {
                $table->string('status', 30)->default('active')->after('cart_token')->index();
            }

            if (! Schema::hasColumn('carts', 'checked_out_at')) {
                $table->timestamp('checked_out_at')->nullable()->after('status');
            }
        });

        Schema::table('product_stock_units', function (Blueprint $table): void {
            if (! Schema::hasColumn('product_stock_units', 'reserved_order_id')) {
                $table->uuid('reserved_order_id')->nullable()->after('product_variant_id');
                $table->foreign('reserved_order_id')->references('id')->on('orders')->nullOnDelete();
                $table->index('reserved_order_id');
            }

            if (! Schema::hasColumn('product_stock_units', 'reserved_at')) {
                $table->timestamp('reserved_at')->nullable()->after('reserved_order_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('product_stock_units', function (Blueprint $table): void {
            if (Schema::hasColumn('product_stock_units', 'reserved_order_id')) {
                $table->dropForeign(['reserved_order_id']);
                $table->dropIndex(['reserved_order_id']);
                $table->dropColumn('reserved_order_id');
            }

            if (Schema::hasColumn('product_stock_units', 'reserved_at')) {
                $table->dropColumn('reserved_at');
            }
        });

        Schema::table('carts', function (Blueprint $table): void {
            if (Schema::hasColumn('carts', 'checked_out_at')) {
                $table->dropColumn('checked_out_at');
            }

            if (Schema::hasColumn('carts', 'status')) {
                $table->dropIndex(['status']);
                $table->dropColumn('status');
            }
        });
    }
};
