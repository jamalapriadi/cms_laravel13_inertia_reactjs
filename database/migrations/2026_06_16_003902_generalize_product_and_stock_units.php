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
        // 1. Update products table
        Schema::table('products', function (Blueprint $table) {
            $table->string('product_type')->default('simple')->after('has_variant');
            $table->string('status')->default('active')->after('product_type');
            $table->text('short_description')->nullable()->after('description');
            $table->decimal('compare_at_price', 15, 2)->nullable()->after('base_price');
            $table->decimal('cost_price', 15, 2)->nullable()->after('compare_at_price');
            $table->decimal('weight', 10, 2)->nullable()->after('cost_price');
            $table->decimal('length', 10, 2)->nullable()->after('weight');
            $table->decimal('width', 10, 2)->nullable()->after('length');
            $table->decimal('height', 10, 2)->nullable()->after('width');
            $table->string('visibility')->default('visible')->after('status');
            $table->boolean('is_featured')->default(false)->after('visibility');
            $table->integer('sort_order')->default(0)->after('is_featured');

            // Make condition nullable
            $table->string('condition')->nullable()->change();
        });

        // 2. Update product_stock_units table
        Schema::table('product_stock_units', function (Blueprint $table) {
            // Drop network compatibility index first
            $table->dropIndex('product_stock_units_network_compatibility_index');

            $table->dropColumn(['battery_health', 'grade', 'network_compatibility']);
            $table->string('imei_serial_number')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Revert product_stock_units table
        Schema::table('product_stock_units', function (Blueprint $table) {
            $table->string('imei_serial_number')->nullable(false)->change();

            $table->unsignedTinyInteger('battery_health')->nullable()->after('barcode');
            $table->string('grade', 50)->nullable()->after('battery_health');
            $table->string('network_compatibility')->nullable()->after('grade');
            $table->index('network_compatibility');
        });

        // 2. Revert products table
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'product_type',
                'status',
                'short_description',
                'compare_at_price',
                'cost_price',
                'weight',
                'length',
                'width',
                'height',
                'visibility',
                'is_featured',
                'sort_order',
            ]);

            // Revert condition column
            $table->enum('condition', ['new', 'like_new', 'second'])->default('new')->change();
        });
    }
};
