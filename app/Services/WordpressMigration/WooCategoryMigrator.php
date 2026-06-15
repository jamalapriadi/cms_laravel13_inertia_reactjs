<?php

namespace App\Services\WordpressMigration;

use App\Models\Shop\Category;
use Illuminate\Support\Facades\DB;

class WooCategoryMigrator extends BaseMigrator
{
    public function migrate(array &$report): void
    {
        $report['product_categories'] = [
            'total' => 0,
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        try {
            $wpCategories = DB::connection('wordpress')
                ->table($this->wpTable('terms').' as t')
                ->join($this->wpTable('term_taxonomy').' as tt', 't.term_id', '=', 'tt.term_id')
                ->where('tt.taxonomy', 'product_cat')
                ->select('t.term_id', 't.name', 't.slug', 'tt.description', 'tt.parent')
                ->orderBy('tt.parent') // Migrating parent first where possible
                ->when($this->limit, fn ($q) => $q->limit($this->limit))
                ->get();
        } catch (\Throwable $e) {
            $report['product_categories']['errors']++;
            logger()->error('WordPress WooCommerce Category Migration: Failed to query source database: '.$e->getMessage());

            return;
        }

        $report['product_categories']['total'] = $wpCategories->count();

        foreach ($wpCategories as $wpCategory) {
            try {
                $mappedUuid = $this->getMappedId($wpCategory->term_id, 'woo_product_category');

                if ($this->dryRun) {
                    if ($mappedUuid) {
                        $report['product_categories']['updated']++;
                    } else {
                        $report['product_categories']['created']++;
                    }

                    continue;
                }

                $slug = $this->resolveUniqueSlug('categories', $wpCategory->slug, $mappedUuid, 'id');

                $data = [
                    'name' => $wpCategory->name,
                    'slug' => $slug,
                    'description' => $wpCategory->description,
                    'is_publish' => true,
                ];

                if ($mappedUuid) {
                    $category = Category::find($mappedUuid);
                    if ($category) {
                        $category->update($data);
                        $report['product_categories']['updated']++;
                    } else {
                        $category = Category::create($data);
                        $this->recordMapping($wpCategory->term_id, 'woo_product_category', 'categories', $category->id);
                        $report['product_categories']['created']++;
                    }
                } else {
                    $category = Category::create($data);
                    $this->recordMapping($wpCategory->term_id, 'woo_product_category', 'categories', $category->id);
                    $report['product_categories']['created']++;
                }
            } catch (\Throwable $e) {
                $report['product_categories']['errors']++;
                logger()->error("WordPress WooCommerce Category Migration: Failed for ID {$wpCategory->term_id}: ".$e->getMessage());
            }
        }

        // Second pass: Update parent category relationships
        if (! $this->dryRun) {
            foreach ($wpCategories as $wpCategory) {
                if ($wpCategory->parent > 0) {
                    $childUuid = $this->getMappedId($wpCategory->term_id, 'woo_product_category');
                    $parentUuid = $this->getMappedId($wpCategory->parent, 'woo_product_category');

                    if ($childUuid && $parentUuid) {
                        Category::where('id', $childUuid)->update(['parent_id' => $parentUuid]);
                    }
                }
            }
        }
    }

    public function rollback(array &$report): void
    {
        $report['product_categories_rollback'] = [
            'deleted' => 0,
            'errors' => 0,
        ];

        try {
            $laravelUuids = $this->deleteMappingsForType('woo_product_category');

            if ($this->dryRun) {
                $report['product_categories_rollback']['deleted'] = count($laravelUuids);

                return;
            }

            if (! empty($laravelUuids)) {
                // Remove parent relations first to avoid foreign key issues
                Category::whereIn('id', $laravelUuids)->update(['parent_id' => null]);

                // Set category_id to null or delete products?
                // Note: category_id in products table is NOT NULL.
                // However, we will rollback products before rollback categories.
                // If there are orphaned products, this could fail, so product rollback must run first.
                $deletedCount = Category::whereIn('id', $laravelUuids)->delete();
                $report['product_categories_rollback']['deleted'] = $deletedCount;
            }
        } catch (\Throwable $e) {
            $report['product_categories_rollback']['errors']++;
            logger()->error('WordPress WooCommerce Category Rollback Failed: '.$e->getMessage());
        }
    }
}
