<?php

namespace App\Services\WordpressMigration;

use App\Models\PostCategory;
use Illuminate\Support\Facades\DB;

class CategoryMigrator extends BaseMigrator
{
    public function migrate(array &$report): void
    {
        $report['categories'] = [
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
                ->where('tt.taxonomy', 'category')
                ->select('t.term_id', 't.name', 't.slug', 'tt.description', 'tt.parent')
                ->orderBy('tt.parent') // Migrating parent first where possible
                ->when($this->limit, fn ($q) => $q->limit($this->limit))
                ->get();
        } catch (\Throwable $e) {
            $report['categories']['errors']++;
            logger()->error('WordPress Category Migration: Failed to query source database: '.$e->getMessage());

            return;
        }

        $report['categories']['total'] = $wpCategories->count();

        foreach ($wpCategories as $wpCategory) {
            try {
                $mappedUuid = $this->getMappedId($wpCategory->term_id, 'category');

                if ($this->dryRun) {
                    if ($mappedUuid) {
                        $report['categories']['updated']++;
                    } else {
                        $report['categories']['created']++;
                    }

                    continue;
                }

                $slug = $this->resolveUniqueSlug('post_categories', $wpCategory->slug, $mappedUuid, 'id');

                $data = [
                    'category_name' => $wpCategory->name,
                    'slug' => $slug,
                    'description' => $wpCategory->description,
                ];

                if ($mappedUuid) {
                    $postCategory = PostCategory::find($mappedUuid);
                    if ($postCategory) {
                        $postCategory->update($data);
                        $report['categories']['updated']++;
                    } else {
                        // Recreate if mapping exists but record was deleted
                        $postCategory = PostCategory::create($data);
                        $this->recordMapping($wpCategory->term_id, 'category', 'post_categories', $postCategory->id);
                        $report['categories']['created']++;
                    }
                } else {
                    $postCategory = PostCategory::create($data);
                    $this->recordMapping($wpCategory->term_id, 'category', 'post_categories', $postCategory->id);
                    $report['categories']['created']++;
                }
            } catch (\Throwable $e) {
                $report['categories']['errors']++;
                logger()->error("WordPress Category Migration: Failed for ID {$wpCategory->term_id}: ".$e->getMessage());
            }
        }

        // Second pass: Update parent category relationships
        if (! $this->dryRun) {
            foreach ($wpCategories as $wpCategory) {
                if ($wpCategory->parent > 0) {
                    $childUuid = $this->getMappedId($wpCategory->term_id, 'category');
                    $parentUuid = $this->getMappedId($wpCategory->parent, 'category');

                    if ($childUuid && $parentUuid) {
                        PostCategory::where('id', $childUuid)->update(['parent_id' => $parentUuid]);
                    }
                }
            }
        }
    }

    public function rollback(array &$report): void
    {
        $report['categories_rollback'] = [
            'deleted' => 0,
            'errors' => 0,
        ];

        try {
            $laravelUuids = $this->deleteMappingsForType('category');

            if ($this->dryRun) {
                $report['categories_rollback']['deleted'] = count($laravelUuids);

                return;
            }

            if (! empty($laravelUuids)) {
                // Remove parent relations first to avoid foreign key issues
                PostCategory::whereIn('id', $laravelUuids)->update(['parent_id' => null]);

                $deletedCount = PostCategory::whereIn('id', $laravelUuids)->delete();
                $report['categories_rollback']['deleted'] = $deletedCount;
            }
        } catch (\Throwable $e) {
            $report['categories_rollback']['errors']++;
            logger()->error('WordPress Category Rollback Failed: '.$e->getMessage());
        }
    }
}
