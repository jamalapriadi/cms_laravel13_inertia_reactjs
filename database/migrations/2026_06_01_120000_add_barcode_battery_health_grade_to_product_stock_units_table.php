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
            if (! Schema::hasColumn('product_stock_units', 'barcode')) {
                $table->string('barcode')->nullable()->unique()->after('imei_serial_number');
            }

            if (! Schema::hasColumn('product_stock_units', 'battery_health')) {
                $table->unsignedTinyInteger('battery_health')->nullable()->after('barcode');
            }

            if (! Schema::hasColumn('product_stock_units', 'grade')) {
                $table->string('grade', 50)->nullable()->after('battery_health');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_stock_units', function (Blueprint $table) {
            if (Schema::hasColumn('product_stock_units', 'grade')) {
                $table->dropColumn('grade');
            }

            if (Schema::hasColumn('product_stock_units', 'battery_health')) {
                $table->dropColumn('battery_health');
            }

            if (Schema::hasColumn('product_stock_units', 'barcode')) {
                $table->dropUnique('product_stock_units_barcode_unique');
                $table->dropColumn('barcode');
            }
        });
    }
};
