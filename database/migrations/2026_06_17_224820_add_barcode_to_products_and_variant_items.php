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
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'barcode')) {
                $table->string('barcode')->nullable()->index()->after('sku');
            }
        });

        Schema::table('variant_items', function (Blueprint $table) {
            if (! Schema::hasColumn('variant_items', 'barcode')) {
                $table->string('barcode')->nullable()->index()->after('sku');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'barcode')) {
                $table->dropColumn('barcode');
            }
        });

        Schema::table('variant_items', function (Blueprint $table) {
            if (Schema::hasColumn('variant_items', 'barcode')) {
                $table->dropColumn('barcode');
            }
        });
    }
};
