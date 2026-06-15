<?php

namespace App\Services\WordpressMigration;

use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductImage;
use App\Models\Shop\ProductStockUnit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WooProductMigrator extends BaseMigrator
{
    /**
     * Detect the brand taxonomy used in WooCommerce source database.
     */
    protected function detectBrandTaxonomy(): ?string
    {
        $taxonomies = ['product_brand', 'pa_brand', 'brand'];

        foreach ($taxonomies as $taxonomy) {
            try {
                $exists = DB::connection('wordpress')
                    ->table($this->wpTable('term_taxonomy'))
                    ->where('taxonomy', $taxonomy)
                    ->exists();

                if ($exists) {
                    return $taxonomy;
                }
            } catch (\Throwable $e) {
                // Ignore errors
            }
        }

        return null;
    }

    public function migrate(array &$report): void
    {
        $report['products'] = [
            'total' => 0,
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        // 1. Resolve default category "Uncategorized" in Laravel
        $defaultCategory = Category::where('slug', 'uncategorized')->first();
        if (! $defaultCategory && ! $this->dryRun) {
            $defaultCategory = Category::create([
                'name' => 'Uncategorized',
                'slug' => 'uncategorized',
                'description' => 'Default category for migrated products',
                'is_publish' => true,
            ]);
        }

        $brandTaxonomy = $this->detectBrandTaxonomy();

        // 2. Fetch products from WordPress
        try {
            $wpProducts = DB::connection('wordpress')
                ->table($this->wpTable('posts'))
                ->where('post_type', 'product')
                ->whereIn('post_status', ['publish', 'draft'])
                ->select('ID', 'post_title', 'post_name', 'post_content', 'post_excerpt', 'post_status', 'post_author')
                ->when($this->limit, fn ($q) => $q->limit($this->limit))
                ->get();
        } catch (\Throwable $e) {
            $report['products']['errors']++;
            logger()->error('WordPress WooCommerce Product Migration: Failed to query source database: '.$e->getMessage());

            return;
        }

        $report['products']['total'] = $wpProducts->count();

        foreach ($wpProducts as $wpProduct) {
            try {
                $mappedUuid = $this->getMappedId($wpProduct->ID, 'woo_product');

                // 3. Fetch product metadata
                $meta = DB::connection('wordpress')
                    ->table($this->wpTable('postmeta'))
                    ->where('post_id', $wpProduct->ID)
                    ->whereIn('meta_key', [
                        '_sku', '_regular_price', '_sale_price', '_price', '_stock',
                        '_stock_status', '_manage_stock', '_thumbnail_id',
                        '_product_image_gallery', '_weight', '_length', '_width', '_height',
                    ])
                    ->pluck('meta_value', 'meta_key')
                    ->all();

                // 4. Resolve category
                $categoryTermId = DB::connection('wordpress')
                    ->table($this->wpTable('term_relationships').' as tr')
                    ->join($this->wpTable('term_taxonomy').' as tt', 'tr.term_taxonomy_id', '=', 'tt.term_taxonomy_id')
                    ->where('tr.object_id', $wpProduct->ID)
                    ->where('tt.taxonomy', 'product_cat')
                    ->value('tt.term_id');

                $categoryId = null;
                if ($categoryTermId) {
                    $categoryId = $this->getMappedId((int) $categoryTermId, 'woo_product_category');
                }

                if (! $categoryId) {
                    $categoryId = $defaultCategory ? $defaultCategory->id : null;
                }

                // If Category is still null (e.g. during dryRun or if default category creation failed/skipped)
                // we'll assign a temporary UUID/placeholder or skip. Let's make sure it's valid.
                if (! $categoryId && ! $this->dryRun) {
                    // Fallback to first category available
                    $firstCategory = Category::first();
                    $categoryId = $firstCategory ? $firstCategory->id : null;
                    if (! $categoryId) {
                        logger()->error("WordPress WooCommerce Product Migration: Failed for ID {$wpProduct->ID} because no Category could be resolved.");
                        $report['products']['errors']++;

                        continue;
                    }
                }

                // 5. Resolve brand
                $brandId = null;
                if ($brandTaxonomy) {
                    $brandTermId = DB::connection('wordpress')
                        ->table($this->wpTable('term_relationships').' as tr')
                        ->join($this->wpTable('term_taxonomy').' as tt', 'tr.term_taxonomy_id', '=', 'tt.term_taxonomy_id')
                        ->where('tr.object_id', $wpProduct->ID)
                        ->where('tt.taxonomy', $brandTaxonomy)
                        ->value('tt.term_id');

                    if ($brandTermId) {
                        $brandId = $this->getMappedId((int) $brandTermId, 'woo_brand');
                    }
                }

                // 6. Resolve main image (thumbnail)
                $thumbnailPath = null;
                $thumbnailId = $meta['_thumbnail_id'] ?? null;
                if ($thumbnailId) {
                    $attachedFile = DB::connection('wordpress')
                        ->table($this->wpTable('postmeta'))
                        ->where('post_id', $thumbnailId)
                        ->where('meta_key', '_wp_attached_file')
                        ->value('meta_value');

                    if ($attachedFile) {
                        $thumbnailPath = 'uploads/'.ltrim((string) $attachedFile, '/');
                    }
                }

                if ($this->dryRun) {
                    if ($mappedUuid) {
                        $report['products']['updated']++;
                    } else {
                        $report['products']['created']++;
                    }

                    continue;
                }

                // 7. Create or update product
                $slug = $this->resolveUniqueSlug('products', $wpProduct->post_name ?: Str::slug($wpProduct->post_title), $mappedUuid, 'id');
                $price = (float) ($meta['_price'] ?? $meta['_regular_price'] ?? 0);
                $sku = $meta['_sku'] ?? null;
                if ($sku === '') {
                    $sku = null;
                }

                $data = [
                    'category_id' => $categoryId,
                    'brand_id' => $brandId,
                    'name' => $wpProduct->post_title,
                    'slug' => $slug,
                    'sku' => $sku,
                    'thumbnail' => $thumbnailPath,
                    'description' => $wpProduct->post_content ?: ($wpProduct->post_excerpt ?: null),
                    'condition' => 'new',
                    'base_price' => $price,
                    'has_variant' => false,
                    'is_publish' => $wpProduct->post_status === 'publish',
                    'created_by' => $this->resolveAuthorId($wpProduct->post_author),
                    'updated_by' => $this->resolveAuthorId($wpProduct->post_author),
                ];

                if ($mappedUuid) {
                    $product = Product::find($mappedUuid);
                    if ($product) {
                        $product->update($data);
                        $report['products']['updated']++;
                    } else {
                        $product = Product::create($data);
                        $this->recordMapping($wpProduct->ID, 'woo_product', 'products', $product->id);
                        $report['products']['created']++;
                    }
                } else {
                    $product = Product::create($data);
                    $this->recordMapping($wpProduct->ID, 'woo_product', 'products', $product->id);
                    $report['products']['created']++;
                }

                // 8. Sync Gallery Images
                ProductImage::where('product_id', $product->id)->delete();
                $sortOrder = 0;

                // Add primary image record to product_images table if thumbnail path exists
                if ($thumbnailPath) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image' => $thumbnailPath,
                        'is_primary' => true,
                        'sort_order' => $sortOrder++,
                    ]);
                }

                $galleryIdsString = $meta['_product_image_gallery'] ?? null;
                if ($galleryIdsString) {
                    $galleryIds = array_filter(explode(',', $galleryIdsString));
                    foreach ($galleryIds as $galleryId) {
                        $galleryFile = DB::connection('wordpress')
                            ->table($this->wpTable('postmeta'))
                            ->where('post_id', (int) $galleryId)
                            ->where('meta_key', '_wp_attached_file')
                            ->value('meta_value');

                        if ($galleryFile) {
                            ProductImage::create([
                                'product_id' => $product->id,
                                'image' => 'uploads/'.ltrim((string) $galleryFile, '/'),
                                'is_primary' => false,
                                'sort_order' => $sortOrder++,
                            ]);
                        }
                    }
                }

                // 9. Sync Stock Units
                $manageStock = $meta['_manage_stock'] ?? 'no';
                $stockStatus = $meta['_stock_status'] ?? 'instock';

                if ($manageStock === 'yes') {
                    $stockQty = max(0, (int) ($meta['_stock'] ?? 0));

                    // Retrieve existing available stock units
                    $existingAvailableUnits = ProductStockUnit::where('product_id', $product->id)
                        ->where('status', 'available')
                        ->get();

                    $existingCount = $existingAvailableUnits->count();

                    if ($existingCount < $stockQty) {
                        // Create the missing units
                        $needed = $stockQty - $existingCount;
                        for ($i = 0; $i < $needed; $i++) {
                            ProductStockUnit::create([
                                'product_id' => $product->id,
                                'product_variant_id' => null,
                                'imei_serial_number' => 'WP-'.($product->sku ?: 'PROD').'-'.$wpProduct->ID.'-'.Str::random(5),
                                'network_compatibility' => 'sim_free',
                                'status' => 'available',
                                'battery_health' => 100,
                                'grade' => 'A',
                                'note' => 'Migrated from WooCommerce',
                            ]);
                        }
                    } elseif ($existingCount > $stockQty) {
                        // Delete excess available units
                        $excess = $existingCount - $stockQty;
                        $unitsToDelete = $existingAvailableUnits->take($excess)->pluck('id');
                        ProductStockUnit::whereIn('id', $unitsToDelete)->delete();
                    }
                } else {
                    // Manage stock = no
                    $existingAvailableCount = ProductStockUnit::where('product_id', $product->id)
                        ->where('status', 'available')
                        ->count();

                    if ($stockStatus === 'instock') {
                        // Ensure at least 1 unit exists so it shows as in stock
                        if ($existingAvailableCount === 0) {
                            ProductStockUnit::create([
                                'product_id' => $product->id,
                                'product_variant_id' => null,
                                'imei_serial_number' => 'WP-'.($product->sku ?: 'PROD').'-'.$wpProduct->ID.'-'.Str::random(5),
                                'network_compatibility' => 'sim_free',
                                'status' => 'available',
                                'battery_health' => 100,
                                'grade' => 'A',
                                'note' => 'Migrated from WooCommerce (In Stock status)',
                            ]);
                        }
                    } else {
                        // outofstock: delete all available units
                        ProductStockUnit::where('product_id', $product->id)
                            ->where('status', 'available')
                            ->delete();
                    }
                }
            } catch (\Throwable $e) {
                $report['products']['errors']++;
                logger()->error("WordPress WooCommerce Product Migration: Failed for ID {$wpProduct->ID}: ".$e->getMessage());
            }
        }
    }

    public function rollback(array &$report): void
    {
        $report['products_rollback'] = [
            'deleted' => 0,
            'errors' => 0,
        ];

        try {
            $laravelUuids = $this->deleteMappingsForType('woo_product');

            if ($this->dryRun) {
                $report['products_rollback']['deleted'] = count($laravelUuids);

                return;
            }

            if (! empty($laravelUuids)) {
                // Delete products (cascading deletes for product_images and product_stock_units)
                $deletedCount = Product::whereIn('id', $laravelUuids)->delete();
                $report['products_rollback']['deleted'] = $deletedCount;
            }
        } catch (\Throwable $e) {
            $report['products_rollback']['errors']++;
            logger()->error('WordPress WooCommerce Product Rollback Failed: '.$e->getMessage());
        }
    }
}
