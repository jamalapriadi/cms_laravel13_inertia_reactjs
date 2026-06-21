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
        Schema::create('product_term_taxonomy', function (Blueprint $table) {
            $table->uuid('product_id');
            $table->foreignId('term_taxonomy_id')->constrained('term_taxonomy')->cascadeOnDelete();

            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            $table->primary(['product_id', 'term_taxonomy_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_term_taxonomy');
    }
};
