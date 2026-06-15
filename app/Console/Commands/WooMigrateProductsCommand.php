<?php

namespace App\Console\Commands;

use App\Services\WordpressMigration\WooCommerceMigrationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class WooMigrateProductsCommand extends Command
{
    protected $signature = 'woo:migrate-products
                            {--type=all : The type of data to migrate (all, categories, brands, products)}
                            {--dry-run : Perform a dry run without committing database changes}
                            {--fresh : Clear previously migrated WooCommerce items of the specified type first}
                            {--limit= : Limit the number of records to migrate (useful for testing)}';

    protected $description = 'Migrate products, categories, and brands from WordPress WooCommerce to Laravel Shop';

    public function __construct(
        private readonly WooCommerceMigrationService $migrationService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        // 1. Verify WordPress database connection
        try {
            DB::connection('wordpress')->getPdo();
        } catch (\Throwable $e) {
            $this->error('Failed to connect to the "wordpress" database connection. Please check config/database.php and environment variables.');
            $this->error('Error details: '.$e->getMessage());

            return self::FAILURE;
        }

        // 2. Validate --type option
        $type = $this->option('type');
        $validTypes = ['all', 'categories', 'brands', 'products'];
        if (! in_array($type, $validTypes, true)) {
            $this->error("Invalid type option: '{$type}'. Must be one of: ".implode(', ', $validTypes));

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $fresh = (bool) $this->option('fresh');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;

        // 3. Confirm if fresh option is used
        if ($fresh && ! $dryRun) {
            $this->warn("WARNING: The --fresh option will permanently delete all previously migrated WooCommerce data for type '{$type}'!");
            if (! $this->confirm('Are you sure you want to proceed?', false)) {
                $this->info('Migration aborted.');

                return self::SUCCESS;
            }
        }

        $this->info(($dryRun ? '[DRY-RUN] ' : '').'Starting WooCommerce migration...');

        // 4. Run Migration
        try {
            $report = $this->migrationService->run($type, $dryRun, $fresh, $limit);
        } catch (\Throwable $e) {
            $this->error('WooCommerce Migration failed with a critical error: '.$e->getMessage());
            logger()->critical('WooCommerce Migration Critical Error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return self::FAILURE;
        }

        // 5. Output summary reports
        $this->info(($dryRun ? '[DRY-RUN] ' : '').'Migration summary:');

        $headers = ['Type', 'Total Found', 'Created', 'Updated', 'Skipped', 'Errors'];
        $rows = [];
        foreach ($report as $key => $metrics) {
            if (str_ends_with($key, '_rollback')) {
                continue;
            }
            $rows[] = [
                ucfirst(str_replace('_', ' ', $key)),
                $metrics['total'] ?? 0,
                $metrics['created'] ?? 0,
                $metrics['updated'] ?? 0,
                $metrics['skipped'] ?? 0,
                $metrics['errors'] ?? 0,
            ];
        }
        $this->table($headers, $rows);

        // Output rollback summary if cleanup was executed
        $hasRollback = collect(array_keys($report))->contains(fn ($key) => str_ends_with($key, '_rollback'));
        if ($hasRollback) {
            $this->info('Cleanup/Rollback summary:');
            $rbHeaders = ['Type', 'Deleted Records', 'Errors'];
            $rbRows = [];
            foreach ($report as $key => $metrics) {
                if (! str_ends_with($key, '_rollback')) {
                    continue;
                }
                $rbRows[] = [
                    ucfirst(str_replace('_rollback', '', str_replace('_', ' ', $key))),
                    $metrics['deleted'] ?? 0,
                    $metrics['errors'] ?? 0,
                ];
            }
            $this->table($rbHeaders, $rbRows);
        }

        $this->info(($dryRun ? '[DRY-RUN] ' : '').'Migration process completed.');

        return self::SUCCESS;
    }
}
