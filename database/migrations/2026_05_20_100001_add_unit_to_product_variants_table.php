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
        Schema::table('product_variants', function (Blueprint $table) {
            $table->ulid('unit_id')->nullable()->after('weight');
            $table->foreign('unit_id')->references('id')->on('units')->nullOnDelete();
            $table->index('unit_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropForeignIdFor('units', 'unit_id');
            $table->dropColumn('unit_id');
        });
    }
};
