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
        Schema::create('product_collections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type')->nullable();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('banner_image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('show_home')->default(false);
            $table->dateTime('start_at')->nullable();
            $table->dateTime('end_at')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('slug');
            $table->index('type');
            $table->index('is_active');
            $table->index('show_home');
            $table->index('sort_order');
        });

        Schema::create('product_collection_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_collection_id');
            $table->uuid('product_id');
            $table->uuid('variant_item_id')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('product_collection_id')
                ->references('id')
                ->on('product_collections')
                ->cascadeOnDelete();

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->cascadeOnDelete();

            $table->foreign('variant_item_id')
                ->references('id')
                ->on('variant_items')
                ->cascadeOnDelete();

            $table->unique(
                ['product_collection_id', 'product_id', 'variant_item_id'],
                'pci_collection_product_variant_unique'
            );

            $table->index('product_collection_id');
            $table->index('product_id');
            $table->index('variant_item_id');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_collection_items');
        Schema::dropIfExists('product_collections');
    }
};
