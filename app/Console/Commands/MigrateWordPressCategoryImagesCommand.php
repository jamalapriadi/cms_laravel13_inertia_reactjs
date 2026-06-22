<?php

namespace App\Console\Commands;

use App\Models\Shop\Category;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MigrateWordPressCategoryImagesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'categories:migrate-wordpress-images
                            {--dry-run : Preview changes without writing to database}
                            {--force : Required when running in production}
                            {--only-missing : Only update Laravel categories where image is null or empty}
                            {--limit= : Limit the number of WordPress categories processed}
                            {--fallback-name : Allow fallback matching by category name if slug match is not found}
                            {--wp-prefix= : The table prefix for WordPress tables (defaults to WORDPRESS_TABLE_PREFIX env or wpzo_)}
                            {--wp-uploads-url= : Custom WordPress uploads URL (overrides WORDPRESS_UPLOADS_URL env)}
                            {--s3-prefix=uploads : S3 prefix to prepend to the uploads path}
                            {--relative : Save image as relative path instead of full URL}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate WordPress WooCommerce product category images into the Laravel categories database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $wpPrefix = $this->option('wp-prefix') ?: env('WORDPRESS_TABLE_PREFIX', 'wpzo_');
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');
        $onlyMissing = (bool) $this->option('only-missing');
        $fallbackName = (bool) $this->option('fallback-name');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;

        if (app()->environment('production') && ! $force && ! $dryRun) {
            $this->error('Running in production requires the --force option.');

            return self::FAILURE;
        }

        if (config('database.connections.wordpress.prefix') !== $wpPrefix) {
            config(['database.connections.wordpress.prefix' => $wpPrefix]);
            DB::purge('wordpress');
        }

        try {
            DB::connection('wordpress')->getPdo();
        } catch (\Throwable $e) {
            $this->error('Failed to connect to the "wordpress" database connection. Please check your credentials.');
            $this->error('Error details: '.$e->getMessage());

            return self::FAILURE;
        }

        $requiredTables = ['terms', 'term_taxonomy', 'termmeta', 'posts', 'postmeta'];
        foreach ($requiredTables as $table) {
            if (! Schema::connection('wordpress')->hasTable($table)) {
                $this->error("Required WordPress table '{$table}' does not exist in the connection with prefix '{$wpPrefix}'.");

                return self::FAILURE;
            }
        }

        $this->info(($dryRun ? '[DRY-RUN] ' : '').'Starting WooCommerce category images migration...');
        $this->info("WordPress table prefix: {$wpPrefix}");

        try {
            $wpCategories = DB::connection('wordpress')
                ->table('terms as t')
                ->join('term_taxonomy as tt', 't.term_id', '=', 'tt.term_id')
                ->leftJoin('termmeta as tm', function ($join) {
                    $join->on('t.term_id', '=', 'tm.term_id')
                        ->where('tm.meta_key', '=', 'thumbnail_id');
                })
                ->leftJoin('posts as p_att', function ($join) {
                    $join->on('p_att.ID', '=', 'tm.meta_value')
                        ->where('p_att.post_type', '=', 'attachment');
                })
                ->leftJoin('postmeta as pm_file', function ($join) {
                    $join->on('pm_file.post_id', '=', 'p_att.ID')
                        ->where('pm_file.meta_key', '=', '_wp_attached_file');
                })
                ->where('tt.taxonomy', 'product_cat')
                ->select([
                    't.term_id',
                    't.name',
                    't.slug',
                    'tm.meta_value as thumbnail_id',
                    'pm_file.meta_value as attached_file',
                    'p_att.guid as guid',
                ])
                ->when($limit, fn ($q) => $q->limit($limit))
                ->get();
        } catch (\Throwable $e) {
            $this->error('Failed to query WordPress WooCommerce categories: '.$e->getMessage());

            return self::FAILURE;
        }

        $totalFound = $wpCategories->count();
        $this->info("Found {$totalFound} WooCommerce categories in WordPress database.");

        $updatedCount = 0;
        $skippedNoThumbnail = 0;
        $skippedLaravelNotFound = 0;
        $skippedAlreadyExists = 0;
        $failedCount = 0;

        foreach ($wpCategories as $wpCategory) {
            $this->line("Processing Category: {$wpCategory->name} (slug: {$wpCategory->slug})");

            if (empty($wpCategory->thumbnail_id)) {
                $this->line(' -> Skipped: No thumbnail configured.');
                $skippedNoThumbnail++;

                continue;
            }

            $imageValue = $this->resolveImage((string) $wpCategory->attached_file, $wpCategory->guid);

            if (empty($imageValue)) {
                $this->warn(" -> Skipped: Thumbnail ID {$wpCategory->thumbnail_id} exists but could not resolve attached file or guid.");
                $skippedNoThumbnail++;

                continue;
            }

            $laravelCategory = Category::where('slug', $wpCategory->slug)->first();

            if (! $laravelCategory && $fallbackName) {
                $laravelCategory = Category::where('name', $wpCategory->name)->first();
            }

            if (! $laravelCategory) {
                $laravelId = DB::table('wordpress_migration_maps')
                    ->where('wordpress_id', $wpCategory->term_id)
                    ->where('wordpress_type', 'woo_product_category')
                    ->value('laravel_id');
                if ($laravelId) {
                    $laravelCategory = Category::find($laravelId);
                }
            }

            if (! $laravelCategory) {
                $this->warn(" -> Skipped: No matching Laravel category found for slug: '{$wpCategory->slug}' (ID: {$wpCategory->term_id})");
                $skippedLaravelNotFound++;

                continue;
            }

            if ($onlyMissing && ! empty($laravelCategory->image)) {
                $this->line(' -> Skipped: Category already has an image.');
                $skippedAlreadyExists++;

                continue;
            }

            if ($laravelCategory->image === $imageValue) {
                $this->line(' -> Skipped: Image path/URL is already up to date.');
                $skippedAlreadyExists++;

                continue;
            }

            try {
                if ($dryRun) {
                    $this->info(" -> [DRY-RUN] Would update category '{$laravelCategory->name}' with image: '{$imageValue}'");
                    $updatedCount++;
                } else {
                    $laravelCategory->update(['image' => $imageValue]);
                    $this->info(" -> [SUCCESS] Updated category '{$laravelCategory->name}' with image: '{$imageValue}'");
                    $updatedCount++;
                }
            } catch (\Throwable $e) {
                $this->error(" -> [ERROR] Failed to update category '{$laravelCategory->name}': ".$e->getMessage());
                $failedCount++;
            }
        }

        $this->info("\nMigration Complete Summary:");
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Found in WP', $totalFound],
                [$dryRun ? 'Would Update' : 'Updated', $updatedCount],
                ['Skipped (No thumbnail)', $skippedNoThumbnail],
                ['Skipped (Laravel category not found)', $skippedLaravelNotFound],
                ['Skipped (Already exists/Up to date)', $skippedAlreadyExists],
                ['Failed (Errors)', $failedCount],
            ]
        );

        return self::SUCCESS;
    }

    /**
     * Resolve WooCommerce category image path or URL.
     */
    protected function resolveImage(string $attachedFile, ?string $guid): string
    {
        $attachedFile = trim($attachedFile);

        if (! empty($attachedFile)) {
            $wpUploadsUrl = $this->option('wp-uploads-url') ?: env('WORDPRESS_UPLOADS_URL');

            if ($wpUploadsUrl) {
                return rtrim($wpUploadsUrl, '/').'/'.ltrim($attachedFile, '/');
            }

            // Remove full URL domain and use relative path starting with /uploads/
            $s3Prefix = $this->option('s3-prefix') ?: 'uploads';
            $prefix = '/'.trim((string) $s3Prefix, '/');

            $attachedFile = trim($attachedFile, '/');
            if ($prefix !== '' && ! str_starts_with($attachedFile, trim($prefix, '/').'/')) {
                return $prefix.'/'.$attachedFile;
            }

            return '/'.ltrim($attachedFile, '/');
        }

        if ($guid) {
            $guid = trim($guid);
            $parsedUrl = parse_url($guid, PHP_URL_PATH);
            if ($parsedUrl) {
                $uploadsIndex = strpos($parsedUrl, '/wp-content/uploads/');
                if ($uploadsIndex !== false) {
                    return '/uploads/'.ltrim(substr($parsedUrl, $uploadsIndex + strlen('/wp-content/uploads/')), '/');
                }

                return $parsedUrl;
            }

            return $guid;
        }

        return '';
    }
}
