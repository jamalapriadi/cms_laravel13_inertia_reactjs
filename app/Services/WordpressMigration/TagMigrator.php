<?php

namespace App\Services\WordpressMigration;

use App\Models\Term;
use App\Models\TermTaxonomy;
use Illuminate\Support\Facades\DB;

class TagMigrator extends BaseMigrator
{
    public function migrate(array &$report): void
    {
        $report['tags'] = [
            'total' => 0,
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        try {
            $wpTags = DB::connection('wordpress')
                ->table($this->wpTable('terms').' as t')
                ->join($this->wpTable('term_taxonomy').' as tt', 't.term_id', '=', 'tt.term_id')
                ->where('tt.taxonomy', 'post_tag')
                ->select('t.term_id', 't.name', 't.slug', 'tt.description')
                ->when($this->limit, fn ($q) => $q->limit($this->limit))
                ->get();
        } catch (\Throwable $e) {
            $report['tags']['errors']++;
            logger()->error('WordPress Tag Migration: Failed to query source database: '.$e->getMessage());

            return;
        }

        $report['tags']['total'] = $wpTags->count();

        foreach ($wpTags as $wpTag) {
            try {
                // Mapped to TermTaxonomy ID (pivot table links term_taxonomy_id to post_id)
                $mappedTaxonomyId = $this->getMappedId($wpTag->term_id, 'tag');

                if ($this->dryRun) {
                    if ($mappedTaxonomyId) {
                        $report['tags']['updated']++;
                    } else {
                        $report['tags']['created']++;
                    }

                    continue;
                }

                $slug = $this->resolveUniqueSlug('terms', $wpTag->slug, $mappedTaxonomyId ? TermTaxonomy::find($mappedTaxonomyId)?->term_id : null, 'id');

                if ($mappedTaxonomyId) {
                    $termTaxonomy = TermTaxonomy::find($mappedTaxonomyId);
                    if ($termTaxonomy && $termTaxonomy->term) {
                        $termTaxonomy->term->update([
                            'name' => $wpTag->name,
                            'slug' => $slug,
                        ]);
                        $termTaxonomy->update([
                            'description' => $wpTag->description,
                        ]);
                        $report['tags']['updated']++;
                    } else {
                        // Recreate
                        $term = Term::create([
                            'name' => $wpTag->name,
                            'slug' => $slug,
                        ]);
                        $termTaxonomy = TermTaxonomy::create([
                            'term_id' => $term->id,
                            'taxonomy' => 'tags',
                            'description' => $wpTag->description,
                            'count' => 0,
                        ]);
                        $this->recordMapping($wpTag->term_id, 'tag', 'term_taxonomy', $termTaxonomy->id);
                        $report['tags']['created']++;
                    }
                } else {
                    // Create new
                    $term = Term::create([
                        'name' => $wpTag->name,
                        'slug' => $slug,
                    ]);
                    $termTaxonomy = TermTaxonomy::create([
                        'term_id' => $term->id,
                        'taxonomy' => 'tags',
                        'description' => $wpTag->description,
                        'count' => 0,
                    ]);
                    $this->recordMapping($wpTag->term_id, 'tag', 'term_taxonomy', $termTaxonomy->id);
                    $report['tags']['created']++;
                }
            } catch (\Throwable $e) {
                $report['tags']['errors']++;
                logger()->error("WordPress Tag Migration: Failed for ID {$wpTag->term_id}: ".$e->getMessage());
            }
        }
    }

    public function rollback(array &$report): void
    {
        $report['tags_rollback'] = [
            'deleted' => 0,
            'errors' => 0,
        ];

        try {
            $laravelTaxonomyIds = $this->deleteMappingsForType('tag');

            if ($this->dryRun) {
                $report['tags_rollback']['deleted'] = count($laravelTaxonomyIds);

                return;
            }

            if (! empty($laravelTaxonomyIds)) {
                $taxonomies = TermTaxonomy::whereIn('id', $laravelTaxonomyIds)->get();
                $termIds = $taxonomies->pluck('term_id')->all();

                // Delete taxonomies (cascades or delete manually)
                TermTaxonomy::whereIn('id', $laravelTaxonomyIds)->delete();
                // Delete base terms
                Term::whereIn('id', $termIds)->delete();

                $report['tags_rollback']['deleted'] = count($laravelTaxonomyIds);
            }
        } catch (\Throwable $e) {
            $report['tags_rollback']['errors']++;
            logger()->error('WordPress Tag Rollback Failed: '.$e->getMessage());
        }
    }
}
