<?php

namespace App\Services\WordpressMigration;

use Illuminate\Support\Facades\DB;

class WordpressMigrationService
{
    private CategoryMigrator $categoryMigrator;

    private TagMigrator $tagMigrator;

    private MediaMigrator $mediaMigrator;

    private PostMigrator $postMigrator;

    private PageMigrator $pageMigrator;

    public function __construct(
        CategoryMigrator $categoryMigrator,
        TagMigrator $tagMigrator,
        MediaMigrator $mediaMigrator,
        PostMigrator $postMigrator,
        PageMigrator $pageMigrator
    ) {
        $this->categoryMigrator = $categoryMigrator;
        $this->tagMigrator = $tagMigrator;
        $this->mediaMigrator = $mediaMigrator;
        $this->postMigrator = $postMigrator;
        $this->pageMigrator = $pageMigrator;
    }

    /**
     * Run the WordPress to Laravel migration.
     */
    public function run(string $type, bool $dryRun = false, bool $fresh = false, ?int $limit = null): array
    {
        $report = [];

        // Determine which migrators to run based on type
        $migrators = $this->resolveMigrators($type, $dryRun, $limit);

        // 1. Rollback if fresh migration is requested
        if ($fresh) {
            foreach (array_reverse($migrators) as $migrator) {
                $migrator->rollback($report);
            }
        }

        // 2. Execute migration inside database transaction
        if ($dryRun) {
            foreach ($migrators as $migrator) {
                $migrator->migrate($report);
            }
        } else {
            DB::transaction(function () use ($migrators, &$report) {
                foreach ($migrators as $migrator) {
                    $migrator->migrate($report);
                }
            });
        }

        return $report;
    }

    /**
     * Resolve the active migrators and configure dry-run / limit options.
     * Order of execution: categories -> tags -> media -> posts -> pages
     */
    private function resolveMigrators(string $type, bool $dryRun, ?int $limit): array
    {
        $map = [
            'categories' => $this->categoryMigrator,
            'tags' => $this->tagMigrator,
            'media' => $this->mediaMigrator,
            'posts' => $this->postMigrator,
            'pages' => $this->pageMigrator,
        ];

        $migrators = [];

        if ($type === 'all') {
            $migrators = array_values($map);
        } elseif (isset($map[$type])) {
            $migrators = [$map[$type]];
        }

        foreach ($migrators as $migrator) {
            $migrator->setDryRun($dryRun)->setLimit($limit);
        }

        return $migrators;
    }
}
