<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_unit_activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_stock_unit_id');
            $table->uuid('user_id')->nullable();
            $table->string('action');
            $table->text('description')->nullable();
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('product_stock_unit_id')
                ->references('id')
                ->on('product_stock_units')
                ->cascadeOnDelete();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->index(['product_stock_unit_id', 'action']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_unit_activities');
    }
};
