<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run migrations
     */
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Brands
        |--------------------------------------------------------------------------
        */
        Schema::create('brands', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('name');
            $table->string('slug')->unique();

            $table->string('logo')->nullable();
            $table->text('description')->nullable();

            $table->boolean('is_active')->default(true);

            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
        });

        /*
        |--------------------------------------------------------------------------
        | Categories
        |--------------------------------------------------------------------------
        */
        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('parent_id')->nullable();

            $table->string('name');
            $table->string('slug')->unique();

            $table->string('image')->nullable();

            $table->integer('sort_order')->default(0);

            $table->boolean('show_home')->default(false);
            $table->boolean('is_publish')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('parent_id')
                ->references('id')
                ->on('categories')
                ->nullOnDelete();

            $table->index('name');
            $table->index('parent_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Products
        |--------------------------------------------------------------------------
        */
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('category_id');
            $table->uuid('brand_id')->nullable();

            $table->string('name');
            $table->string('slug')->unique();

            $table->string('thumbnail')->nullable();

            $table->longText('description')->nullable();

            $table->enum('condition', [
                'new',
                'like_new',
                'second',
            ])->default('new');

            /*
            |--------------------------------------------------------------------------
            | Pricing
            |--------------------------------------------------------------------------
            */

            $table->decimal('base_price', 15, 2)->default(0);

            /*
            |--------------------------------------------------------------------------
            | Variant
            |--------------------------------------------------------------------------
            */

            $table->boolean('has_variant')->default(false);

            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */

            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Publish
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_publish')->default(true);

            /*
            |--------------------------------------------------------------------------
            | Audit
            |--------------------------------------------------------------------------
            */

            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

            /*
            |--------------------------------------------------------------------------
            | Foreign Key
            |--------------------------------------------------------------------------
            */

            $table->foreign('category_id')
                ->references('id')
                ->on('categories')
                ->cascadeOnDelete();

            $table->foreign('brand_id')
                ->references('id')
                ->on('brands')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Index
            |--------------------------------------------------------------------------
            */

            $table->index('name');
            $table->index('slug');
            $table->index('category_id');
            $table->index('brand_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Product Images
        |--------------------------------------------------------------------------
        */
        Schema::create('product_images', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('product_id');

            $table->string('image');

            $table->boolean('is_primary')->default(false);

            $table->integer('sort_order')->default(0);

            $table->timestamps();

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->cascadeOnDelete();

            $table->index('product_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Product Specifications
        |--------------------------------------------------------------------------
        */
        Schema::create('product_specifications', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('product_id');

            $table->string('spec_name');
            $table->text('spec_value')->nullable();

            $table->timestamps();

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->cascadeOnDelete();

            $table->index('product_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Product Variants
        |--------------------------------------------------------------------------
        */
        Schema::create('product_variants', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('product_id');

            $table->string('name');
            $table->integer('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->cascadeOnDelete();

            $table->index('product_id');
            $table->unique(['product_id', 'name']);
        });

        /*
        |--------------------------------------------------------------------------
        | Product Variant Options
        |--------------------------------------------------------------------------
        */
        Schema::create('product_variant_options', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('product_variant_id');

            $table->string('value');
            $table->integer('sort_order')->default(0);

            $table->timestamps();

            $table->foreign('product_variant_id')
                ->references('id')
                ->on('product_variants')
                ->cascadeOnDelete();

            $table->index('product_variant_id');
            $table->unique(['product_variant_id', 'value']);
        });

        /*
        |--------------------------------------------------------------------------
        | Variant Items
        |--------------------------------------------------------------------------
        */
        Schema::create('variant_items', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('product_id');

            $table->string('sku')->unique();
            $table->string('name');
            $table->string('image')->nullable();

            $table->decimal('buying_price', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);

            $table->boolean('track_stock')->default(true);
            $table->integer('stock')->default(0);
            $table->integer('min_stock_alert')->nullable();

            $table->decimal('weight', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->cascadeOnDelete();

            $table->index('product_id');
            $table->index('sku');
            $table->index('is_active');
        });

        /*
        |--------------------------------------------------------------------------
        | Variant Item Options
        |--------------------------------------------------------------------------
        */
        Schema::create('variant_item_options', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('variant_item_id');
            $table->uuid('product_variant_option_id');

            $table->timestamps();

            $table->foreign('variant_item_id')
                ->references('id')
                ->on('variant_items')
                ->cascadeOnDelete();

            $table->foreign('product_variant_option_id')
                ->references('id')
                ->on('product_variant_options')
                ->cascadeOnDelete();

            $table->unique(['variant_item_id', 'product_variant_option_id'], 'vio_item_option_unique');
            $table->index('variant_item_id');
            $table->index('product_variant_option_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Orders
        |--------------------------------------------------------------------------
        */
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('invoice_number')->unique();

            $table->uuid('user_id')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Customer
            |--------------------------------------------------------------------------
            */

            $table->string('customer_name');

            $table->string('customer_email')->nullable();

            $table->string('customer_phone')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Shipping
            |--------------------------------------------------------------------------
            */

            $table->text('shipping_address')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Financial
            |--------------------------------------------------------------------------
            */

            $table->decimal('subtotal', 15, 2)->default(0);

            $table->decimal('shipping_cost', 15, 2)->default(0);

            $table->decimal('discount', 15, 2)->default(0);

            $table->decimal('grand_total', 15, 2)->default(0);

            /*
            |--------------------------------------------------------------------------
            | Payment Status
            |--------------------------------------------------------------------------
            */

            $table->enum('payment_status', [
                'pending',
                'paid',
                'failed',
                'expired',
                'refunded',
            ])->default('pending');

            /*
            |--------------------------------------------------------------------------
            | Order Status
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'pending',
                'processing',
                'shipped',
                'completed',
                'cancelled',
            ])->default('pending');

            $table->timestamp('paid_at')->nullable();

            $table->timestamps();

            $table->index('invoice_number');
            $table->index('user_id');
            $table->index('status');
            $table->index('payment_status');
        });

        /*
        |--------------------------------------------------------------------------
        | Order Items
        |--------------------------------------------------------------------------
        */
        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('order_id');

            $table->uuid('product_id');

            $table->uuid('product_variant_id')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Product Snapshot
            |--------------------------------------------------------------------------
            */

            $table->string('product_name');

            $table->string('variant_name')->nullable();

            $table->decimal('price', 15, 2);

            $table->integer('qty')->default(1);

            $table->decimal('subtotal', 15, 2);

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Foreign Key
            |--------------------------------------------------------------------------
            */

            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->cascadeOnDelete();

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->cascadeOnDelete();

            $table->foreign('product_variant_id')
                ->references('id')
                ->on('variant_items')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Index
            |--------------------------------------------------------------------------
            */

            $table->index('order_id');
            $table->index('product_id');
            $table->index('product_variant_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Carts
        |--------------------------------------------------------------------------
        */
        Schema::create('carts', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('user_id')->nullable();

            $table->timestamps();

            $table->index('user_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Cart Items
        |--------------------------------------------------------------------------
        */
        Schema::create('cart_items', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('cart_id');

            $table->uuid('product_id');

            $table->uuid('product_variant_id')->nullable();

            $table->integer('qty')->default(1);

            $table->timestamps();

            $table->foreign('cart_id')
                ->references('id')
                ->on('carts')
                ->cascadeOnDelete();

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->cascadeOnDelete();

            $table->foreign('product_variant_id')
                ->references('id')
                ->on('variant_items')
                ->nullOnDelete();

            $table->index('cart_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Payments
        |--------------------------------------------------------------------------
        */
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('order_id');

            $table->string('payment_method');

            $table->string('transaction_id')->nullable();

            $table->decimal('amount', 15, 2);

            $table->enum('status', [
                'pending',
                'paid',
                'failed',
                'expired',
                'refunded',
            ])->default('pending');

            $table->json('payload')->nullable();

            $table->timestamp('paid_at')->nullable();

            $table->timestamps();

            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->cascadeOnDelete();

            $table->index('order_id');
            $table->index('transaction_id');
            $table->index('status');
        });

        /*
        |--------------------------------------------------------------------------
        | Stock Movements
        |--------------------------------------------------------------------------
        */
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('product_variant_id');

            $table->enum('type', [
                'sale',
                'purchase',
                'adjustment',
                'return',
                'cancel',
            ]);

            $table->integer('qty');

            $table->integer('stock_before');

            $table->integer('stock_after');

            $table->text('note')->nullable();

            $table->uuid('created_by')->nullable();

            $table->timestamps();

            $table->foreign('product_variant_id')
                ->references('id')
                ->on('variant_items')
                ->cascadeOnDelete();

            $table->index('product_variant_id');
            $table->index('type');
        });
    }

    /**
     * Reverse migrations
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('carts');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('variant_item_options');
        Schema::dropIfExists('variant_items');
        Schema::dropIfExists('product_variant_options');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('product_specifications');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('brands');
    }
};
