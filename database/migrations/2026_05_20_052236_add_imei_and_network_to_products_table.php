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
            $table->boolean('requires_imei')->default(false)->after('has_variant');
            $table->string('imei_serial_number')->nullable()->after('requires_imei');
            $table->string('network_compatibility')->nullable()->after('imei_serial_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['requires_imei', 'imei_serial_number', 'network_compatibility']);
        });
    }
};
