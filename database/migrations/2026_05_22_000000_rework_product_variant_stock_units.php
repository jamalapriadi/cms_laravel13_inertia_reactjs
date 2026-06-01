<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_stock_units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_variant_id');
            $table->string('imei_serial_number')->unique();
            $table->enum('network_compatibility', [
                'sim_free',
                'docomo',
                'au',
                'softbank',
                'rakuten',
                'mineo',
            ])->default('sim_free');
            $table->enum('status', [
                'available',
                'reserved',
                'sold',
                'damaged',
            ])->default('available');
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('product_variant_id')
                ->references('id')
                ->on('variant_items')
                ->cascadeOnDelete();

            $table->index('product_variant_id');
            $table->index('network_compatibility');
            $table->index('status');
        });

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'requires_imei')) {
                $table->dropColumn('requires_imei');
            }

            if (Schema::hasColumn('products', 'imei_serial_number')) {
                $table->dropColumn('imei_serial_number');
            }

            if (Schema::hasColumn('products', 'network_compatibility')) {
                $table->dropColumn('network_compatibility');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('requires_imei')->default(false)->after('has_variant');
            $table->string('imei_serial_number')->nullable()->after('requires_imei');
            $table->string('network_compatibility')->nullable()->after('imei_serial_number');
        });

        Schema::dropIfExists('product_stock_units');
    }
};
