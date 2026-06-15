<?php

namespace App\Services\WordpressMigration;

use App\Models\Shop\Brand;
use Illuminate\Support\Facades\DB;

class WooBrandMigrator extends BaseMigrator
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
                // Ignore errors (e.g. table not existing yet during testing/setup)
            }
        }

        return null;
    }

    public function migrate(array &$report): void
    {
        $report['brands'] = [
            'total' => 0,
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        $taxonomy = $this->detectBrandTaxonomy();

        if (! $taxonomy) {
            logger()->warning('WordPress Brand Migration: No WooCommerce brand taxonomy (product_brand, pa_brand, brand) was found in source database.');

            return;
        }

        try {
            $wpBrands = DB::connection('wordpress')
                ->table($this->wpTable('terms').' as t')
                ->join($this->wpTable('term_taxonomy').' as tt', 't.term_id', '=', 'tt.term_id')
                ->where('tt.taxonomy', $taxonomy)
                ->select('t.term_id', 't.name', 't.slug', 'tt.description')
                ->when($this->limit, fn ($q) => $q->limit($this->limit))
                ->get();
        } catch (\Throwable $e) {
            $report['brands']['errors']++;
            logger()->error('WordPress Brand Migration: Failed to query source database: '.$e->getMessage());

            return;
        }

        $report['brands']['total'] = $wpBrands->count();

        foreach ($wpBrands as $wpBrand) {
            try {
                $mappedUuid = $this->getMappedId($wpBrand->term_id, 'woo_brand');

                if ($this->dryRun) {
                    if ($mappedUuid) {
                        $report['brands']['updated']++;
                    } else {
                        $report['brands']['created']++;
                    }

                    continue;
                }

                $slug = $this->resolveUniqueSlug('brands', $wpBrand->slug, $mappedUuid, 'id');

                $data = [
                    'name' => $wpBrand->name,
                    'slug' => $slug,
                    'description' => $wpBrand->description,
                    'is_active' => true,
                ];

                if ($mappedUuid) {
                    $brand = Brand::find($mappedUuid);
                    if ($brand) {
                        $brand->update($data);
                        $report['brands']['updated']++;
                    } else {
                        $brand = Brand::create($data);
                        $this->recordMapping($wpBrand->term_id, 'woo_brand', 'brands', $brand->id);
                        $report['brands']['created']++;
                    }
                } else {
                    $brand = Brand::create($data);
                    $this->recordMapping($wpBrand->term_id, 'woo_brand', 'brands', $brand->id);
                    $report['brands']['created']++;
                }
            } catch (\Throwable $e) {
                $report['brands']['errors']++;
                logger()->error("WordPress Brand Migration: Failed for ID {$wpBrand->term_id}: ".$e->getMessage());
            }
        }
    }

    public function rollback(array &$report): void
    {
        $report['brands_rollback'] = [
            'deleted' => 0,
            'errors' => 0,
        ];

        try {
            $laravelUuids = $this->deleteMappingsForType('woo_brand');

            if ($this->dryRun) {
                $report['brands_rollback']['deleted'] = count($laravelUuids);

                return;
            }

            if (! empty($laravelUuids)) {
                // Set brand_id to null on products first
                DB::table('products')->whereIn('brand_id', $laravelUuids)->update(['brand_id' => null]);

                $deletedCount = Brand::whereIn('id', $laravelUuids)->delete();
                $report['brands_rollback']['deleted'] = $deletedCount;
            }
        } catch (\Throwable $e) {
            $report['brands_rollback']['errors']++;
            logger()->error('WordPress Brand Rollback Failed: '.$e->getMessage());
        }
    }
}
