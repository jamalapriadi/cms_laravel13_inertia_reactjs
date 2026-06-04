<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('brands', function (Blueprint $table): void {
            $table->index(['is_active', 'name'], 'brands_active_name_idx');
        });

        Schema::table('categories', function (Blueprint $table): void {
            $table->index(['parent_id', 'is_publish', 'sort_order', 'name'], 'categories_parent_publish_sort_name_idx');
        });

        Schema::table('products', function (Blueprint $table): void {
            $table->index(['is_publish', 'created_at'], 'products_publish_created_idx');
            $table->index(['category_id', 'created_at'], 'products_category_created_idx');
            $table->index(['brand_id', 'created_at'], 'products_brand_created_idx');
        });

        Schema::table('product_images', function (Blueprint $table): void {
            $table->index(['product_id', 'is_primary', 'sort_order', 'created_at'], 'product_images_product_primary_sort_created_idx');
        });

        Schema::table('product_specifications', function (Blueprint $table): void {
            $table->index(['product_id', 'created_at'], 'product_specs_product_created_idx');
        });

        Schema::table('variant_items', function (Blueprint $table): void {
            $table->index(['product_id', 'is_active', 'selling_price'], 'variant_items_product_active_price_idx');
            $table->index(['is_active', 'sku'], 'variant_items_active_sku_idx');
        });

        Schema::table('product_stock_units', function (Blueprint $table): void {
            $table->index(['product_id', 'status', 'product_variant_id'], 'product_stock_units_product_variant_status_idx');
            $table->index(['product_variant_id', 'status'], 'product_stock_units_variant_status_idx');
            $table->index(['status', 'created_at'], 'product_stock_units_status_created_idx');
            $table->index(['reserved_order_id', 'status'], 'product_stock_units_reserved_status_idx');
            $table->index(['incoming_goods_item_id', 'created_at'], 'product_stock_units_incoming_created_idx');
        });

        Schema::table('carts', function (Blueprint $table): void {
            $table->index(['customer_id', 'status', 'updated_at'], 'carts_customer_status_updated_idx');
            $table->index('updated_at', 'carts_updated_at_idx');
        });

        Schema::table('cart_items', function (Blueprint $table): void {
            $table->index(['cart_id', 'product_id', 'product_variant_id'], 'cart_items_cart_product_variant_idx');
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->index(['customer_id', 'created_at'], 'orders_customer_created_idx');
            $table->index(['payment_status', 'created_at'], 'orders_payment_created_idx');
            $table->index(['status', 'created_at'], 'orders_status_created_idx');
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->index(['status', 'created_at'], 'payments_status_created_idx');
            $table->index(['order_id', 'status'], 'payments_order_status_idx');
        });

        Schema::table('stock_movements', function (Blueprint $table): void {
            $table->index(['type', 'created_at'], 'stock_movements_type_created_idx');
            $table->index(['product_variant_id', 'created_at'], 'stock_movements_variant_created_idx');
            $table->index(['product_stock_unit_id', 'created_at'], 'stock_movements_unit_created_idx');
        });

        Schema::table('incoming_goods', function (Blueprint $table): void {
            $table->index(['status', 'created_at'], 'incoming_goods_status_created_idx');
        });

        Schema::table('incoming_goods_items', function (Blueprint $table): void {
            $table->index(['incoming_goods_id', 'product_id'], 'incoming_goods_items_incoming_product_idx');
        });

        Schema::table('supplier_returns', function (Blueprint $table): void {
            $table->index(['status', 'created_at'], 'supplier_returns_status_created_idx');
        });

        Schema::table('supplier_return_items', function (Blueprint $table): void {
            $table->index(['supplier_return_id', 'product_stock_unit_id'], 'supplier_return_items_return_unit_idx');
        });

        Schema::table('product_collections', function (Blueprint $table): void {
            $table->index(['is_active', 'type', 'show_home', 'sort_order', 'created_at'], 'product_collections_active_type_home_sort_idx');
        });

        Schema::table('product_collection_items', function (Blueprint $table): void {
            $table->index(['product_collection_id', 'sort_order', 'created_at'], 'pci_collection_sort_created_idx');
        });

        Schema::table('banner_slides', function (Blueprint $table): void {
            $table->index(['is_active', 'type', 'position', 'sort_order', 'created_at'], 'banner_slides_active_type_position_sort_idx');
        });

        Schema::table('faqs', function (Blueprint $table): void {
            $table->index(['is_active', 'show_home', 'type', 'position', 'sort_order'], 'faqs_type_position_active_home_sort_idx');
        });

        Schema::table('site_contents', function (Blueprint $table): void {
            $table->index(['is_active', 'group', 'sort_order', 'key'], 'site_contents_active_group_sort_key_idx');
        });

        Schema::table('posts', function (Blueprint $table): void {
            $table->index(['type', 'status', 'published_at', 'created_at'], 'posts_type_status_published_created_idx');
            $table->index(['status', 'created_at'], 'posts_status_created_idx');
        });

        Schema::table('post_meta', function (Blueprint $table): void {
            $table->index(['post_id', 'meta_key'], 'post_meta_post_key_idx');
        });

        Schema::table('term_taxonomy', function (Blueprint $table): void {
            $table->index(['taxonomy', 'term_id'], 'term_taxonomy_taxonomy_term_idx');
        });

        Schema::table('term_relationships', function (Blueprint $table): void {
            $table->index(['term_taxonomy_id', 'post_id'], 'term_relationships_taxonomy_post_idx');
        });

        Schema::table('post_categories', function (Blueprint $table): void {
            $table->index('slug', 'post_categories_slug_idx');
            $table->index(['parent_id', 'category_name'], 'post_categories_parent_name_idx');
        });

        Schema::table('post_translations', function (Blueprint $table): void {
            $table->index(['slug', 'status', 'published_at'], 'post_translations_slug_status_published_idx');
        });

        Schema::table('blocks', function (Blueprint $table): void {
            $table->index(['post_id', 'order'], 'blocks_post_order_idx');
        });

        Schema::table('translations', function (Blueprint $table): void {
            $table->index(['locale', 'created_at'], 'translations_locale_created_idx');
        });

        Schema::table('media', function (Blueprint $table): void {
            $table->index(['disk', 'path'], 'media_disk_path_idx');
            $table->index('created_at', 'media_created_idx');
        });

        Schema::table('kabupatens', function (Blueprint $table): void {
            $table->index(['province_id', 'name'], 'kabupatens_province_name_idx');
        });

        Schema::table('kecamatans', function (Blueprint $table): void {
            $table->index(['kabupaten_id', 'name'], 'kecamatans_kabupaten_name_idx');
        });

        Schema::table('kelurahans', function (Blueprint $table): void {
            $table->index(['kecamatan_id', 'created_at'], 'kelurahans_kecamatan_created_idx');
        });

        Schema::table('units', function (Blueprint $table): void {
            $table->index(['is_active', 'name'], 'units_active_name_idx');
        });

        Schema::table('suppliers', function (Blueprint $table): void {
            $table->index(['is_active', 'name'], 'suppliers_active_name_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->ensureForeignKeyFallbackIndexes();

        foreach ($this->indexesByTable() as $table => $indexes) {
            foreach (array_reverse($indexes) as $index) {
                $this->dropIndexIfExists($table, $index);
            }
        }
    }

    /**
     * @return array<string, list<string>>
     */
    private function indexesByTable(): array
    {
        return [
            'brands' => ['brands_active_name_idx'],
            'categories' => ['categories_parent_publish_sort_name_idx'],
            'products' => [
                'products_publish_created_idx',
                'products_category_created_idx',
                'products_brand_created_idx',
            ],
            'product_images' => ['product_images_product_primary_sort_created_idx'],
            'product_specifications' => ['product_specs_product_created_idx'],
            'variant_items' => [
                'variant_items_product_active_price_idx',
                'variant_items_active_sku_idx',
            ],
            'product_stock_units' => [
                'product_stock_units_product_variant_status_idx',
                'product_stock_units_variant_status_idx',
                'product_stock_units_status_created_idx',
                'product_stock_units_reserved_status_idx',
                'product_stock_units_incoming_created_idx',
            ],
            'carts' => [
                'carts_customer_status_updated_idx',
                'carts_updated_at_idx',
            ],
            'cart_items' => ['cart_items_cart_product_variant_idx'],
            'orders' => [
                'orders_customer_created_idx',
                'orders_payment_created_idx',
                'orders_status_created_idx',
            ],
            'payments' => [
                'payments_status_created_idx',
                'payments_order_status_idx',
            ],
            'stock_movements' => [
                'stock_movements_type_created_idx',
                'stock_movements_variant_created_idx',
                'stock_movements_unit_created_idx',
            ],
            'incoming_goods' => ['incoming_goods_status_created_idx'],
            'incoming_goods_items' => ['incoming_goods_items_incoming_product_idx'],
            'supplier_returns' => ['supplier_returns_status_created_idx'],
            'supplier_return_items' => ['supplier_return_items_return_unit_idx'],
            'product_collections' => ['product_collections_active_type_home_sort_idx'],
            'product_collection_items' => ['pci_collection_sort_created_idx'],
            'banner_slides' => ['banner_slides_active_type_position_sort_idx'],
            'faqs' => ['faqs_type_position_active_home_sort_idx'],
            'site_contents' => ['site_contents_active_group_sort_key_idx'],
            'posts' => [
                'posts_type_status_published_created_idx',
                'posts_status_created_idx',
            ],
            'post_meta' => ['post_meta_post_key_idx'],
            'term_taxonomy' => ['term_taxonomy_taxonomy_term_idx'],
            'term_relationships' => ['term_relationships_taxonomy_post_idx'],
            'post_categories' => [
                'post_categories_slug_idx',
                'post_categories_parent_name_idx',
            ],
            'post_translations' => ['post_translations_slug_status_published_idx'],
            'blocks' => ['blocks_post_order_idx'],
            'translations' => ['translations_locale_created_idx'],
            'media' => [
                'media_disk_path_idx',
                'media_created_idx',
            ],
            'kabupatens' => ['kabupatens_province_name_idx'],
            'kecamatans' => ['kecamatans_kabupaten_name_idx'],
            'kelurahans' => ['kelurahans_kecamatan_created_idx'],
            'units' => ['units_active_name_idx'],
            'suppliers' => ['suppliers_active_name_idx'],
        ];
    }

    private function ensureForeignKeyFallbackIndexes(): void
    {
        $this->addIndexIfMissing('kabupatens', ['province_id'], 'kabupatens_province_id_fk_idx');
        $this->addIndexIfMissing('kecamatans', ['kabupaten_id'], 'kecamatans_kabupaten_id_fk_idx');
        $this->addIndexIfMissing('kelurahans', ['kecamatan_id'], 'kelurahans_kecamatan_id_fk_idx');
        $this->addIndexIfMissing('incoming_goods_items', ['incoming_goods_id'], 'incoming_goods_items_incoming_goods_id_fk_idx');
        $this->addIndexIfMissing('supplier_return_items', ['supplier_return_id'], 'supplier_return_items_supplier_return_id_fk_idx');
        $this->addIndexIfMissing('term_relationships', ['term_taxonomy_id'], 'term_relationships_term_taxonomy_id_fk_idx');
        $this->addIndexIfMissing('post_categories', ['parent_id'], 'post_categories_parent_id_fk_idx');
        $this->addIndexIfMissing('post_meta', ['post_id'], 'post_meta_post_id_fk_idx');
    }

    /**
     * @param  list<string>  $columns
     */
    private function addIndexIfMissing(string $tableName, array $columns, string $indexName): void
    {
        if ($this->indexExists($tableName, $indexName) || $this->hasExistingIndexForPrefix($tableName, $columns)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($columns, $indexName): void {
            $table->index($columns, $indexName);
        });
    }

    private function dropIndexIfExists(string $tableName, string $indexName): void
    {
        if (! $this->indexExists($tableName, $indexName)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($indexName): void {
            $table->dropIndex($indexName);
        });
    }

    private function indexExists(string $tableName, string $indexName): bool
    {
        $databaseName = DB::connection()->getDatabaseName();

        return DB::table('information_schema.statistics')
            ->where('table_schema', $databaseName)
            ->where('table_name', $tableName)
            ->where('index_name', $indexName)
            ->exists();
    }

    /**
     * @param  list<string>  $columns
     */
    private function hasExistingIndexForPrefix(string $tableName, array $columns): bool
    {
        $createdIndexNames = collect($this->indexesByTable())->flatten()->all();
        $databaseName = DB::connection()->getDatabaseName();

        $indexes = DB::table('information_schema.statistics')
            ->select(['index_name', 'column_name', 'seq_in_index'])
            ->where('table_schema', $databaseName)
            ->where('table_name', $tableName)
            ->whereNotIn('index_name', $createdIndexNames)
            ->orderBy('index_name')
            ->orderBy('seq_in_index')
            ->get()
            ->groupBy('index_name');

        return $indexes->contains(function ($indexColumns) use ($columns): bool {
            return array_slice($indexColumns->pluck('column_name')->all(), 0, count($columns)) === $columns;
        });
    }
};
