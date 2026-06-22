<?php

namespace App\Console\Commands;

use App\Models\Shop\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class WpMigrateProductFeaturedImagesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'wp:migrate-product-featured-images
                            {--wp-prefix=wpzo_ : The table prefix for WordPress tables}
                            {--match=wp_id : Match method to match WordPress products with Laravel products (wp_id or slug)}
                            {--s3-prefix=media : S3 prefix to prepend to the media path}
                            {--dry-run : Preview changes without writing to database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate WordPress WooCommerce product featured images into the Laravel products database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        // 1. Safety Checks
        $baseUrl = rtrim((string) config('services.idcloudhost.url'), '/');
        if (empty($baseUrl)) {
            $this->error('IDCloudHost base URL (IDCH_URL) is not configured. Please set it in your .env file.');

            return self::FAILURE;
        }

        if (! Schema::hasTable('products')) {
            $this->error('Laravel products table does not exist. Please run migrations first.');

            return self::FAILURE;
        }

        $wpPrefix = $this->option('wp-prefix') ?: 'wpzo_';
        $matchMethod = $this->option('match') ?: 'wp_id';
        $s3Prefix = trim((string) $this->option('s3-prefix'), '/');
        $dryRun = (bool) $this->option('dry-run');

        if (! in_array($matchMethod, ['wp_id', 'slug'], true)) {
            $this->error("Invalid match method: '{$matchMethod}'. Must be 'wp_id' or 'slug'.");

            return self::FAILURE;
        }

        // Dynamically configure wordpress prefix and purge connection cache if it changed
        if (config('database.connections.wordpress.prefix') !== $wpPrefix) {
            config(['database.connections.wordpress.prefix' => $wpPrefix]);
            DB::purge('wordpress');
        }

        // Check if WordPress connection tables exist
        try {
            // Test connection first
            DB::connection('wordpress')->getPdo();
        } catch (\Throwable $e) {
            $this->error('Failed to connect to the "wordpress" database connection. Please check your credentials.');
            $this->error('Error details: '.$e->getMessage());

            return self::FAILURE;
        }

        // Schema helper automatically prepends connection prefix
        $hasPostsTable = Schema::connection('wordpress')->hasTable('posts');
        $hasPostmetaTable = Schema::connection('wordpress')->hasTable('postmeta');

        if (! $hasPostsTable || ! $hasPostmetaTable) {
            $this->error("WordPress tables ('posts' or 'postmeta') do not exist in the wordpress connection with prefix '{$wpPrefix}'.");

            return self::FAILURE;
        }

        $this->info(($dryRun ? '[DRY-RUN] ' : '').'Starting WooCommerce product featured images migration...');
        $this->info("WordPress prefix: {$wpPrefix} | Match: {$matchMethod} | S3 prefix: {$s3Prefix}");

        // 2. Fetch WordPress WooCommerce products with their featured image attachments
        // Join: posts (type=product) -> postmeta (_thumbnail_id) -> postmeta (_wp_attached_file)
        try {
            $wpProducts = DB::connection('wordpress')
                ->table('posts as p')
                ->join('postmeta as pm', function ($join) {
                    $join->on('p.ID', '=', 'pm.post_id')
                        ->where('pm.meta_key', '=', '_thumbnail_id');
                })
                ->join('postmeta as pm_file', function ($join) {
                    $join->on('pm_file.post_id', '=', 'pm.meta_value')
                        ->where('pm_file.meta_key', '=', '_wp_attached_file');
                })
                ->leftJoin('posts as p_att', 'p_att.ID', '=', 'pm.meta_value')
                ->where('p.post_type', '=', 'product')
                ->whereIn('p.post_status', ['publish', 'draft'])
                ->select([
                    'p.ID as wp_id',
                    'p.post_name as slug',
                    'p.post_title as title',
                    'pm.meta_value as thumbnail_id',
                    'pm_file.meta_value as attached_file',
                    'p_att.post_mime_type as mime_type',
                ])
                ->get();
        } catch (\Throwable $e) {
            $this->error('Failed to retrieve WordPress products data: '.$e->getMessage());

            return self::FAILURE;
        }

        $totalFound = $wpProducts->count();
        $this->info("Found {$totalFound} WordPress WooCommerce products with featured images.");

        $updatedCount = 0;
        $skippedCount = 0;
        $missingCount = 0;

        foreach ($wpProducts as $wpProduct) {
            // Skip empty attached files
            if (empty($wpProduct->attached_file)) {
                $skippedCount++;

                continue;
            }

            // Find matching Laravel product
            $laravelProduct = null;

            if ($matchMethod === 'wp_id') {
                // 1. Match by wp_id column in products table (if it exists)
                if (Schema::hasColumn('products', 'wp_id')) {
                    $laravelProduct = Product::where('wp_id', $wpProduct->wp_id)->first();
                }

                // 2. Try matching via wordpress_migration_maps if still null (type is woo_product)
                if (! $laravelProduct) {
                    $laravelId = DB::table('wordpress_migration_maps')
                        ->where('wordpress_id', $wpProduct->wp_id)
                        ->where('wordpress_type', 'woo_product')
                        ->value('laravel_id');

                    if ($laravelId) {
                        $laravelProduct = Product::find($laravelId);
                    }
                }

                // 3. Fallback to slug matching
                if (! $laravelProduct) {
                    $laravelProduct = Product::where('slug', $wpProduct->slug)->first();
                }
            } else {
                // Match purely by slug
                $laravelProduct = Product::where('slug', $wpProduct->slug)->first();
            }

            if (! $laravelProduct) {
                $this->warn("No matching Laravel product found for WordPress product ID {$wpProduct->wp_id} (slug: '{$wpProduct->slug}')");
                $missingCount++;

                continue;
            }

            // Process image paths
            $attachedFile = trim($wpProduct->attached_file, '/');
            if ($s3Prefix !== '' && ! str_starts_with($attachedFile, $s3Prefix.'/')) {
                $savedPath = $s3Prefix.'/'.$attachedFile;
            } else {
                $savedPath = $attachedFile;
            }

            $fullUrl = $baseUrl.'/'.ltrim($savedPath, '/');

            // Detect if changes are needed
            $needsUpdate = false;

            if ($laravelProduct->thumbnail !== $savedPath) {
                $needsUpdate = true;
            }

            if (Schema::hasColumn('products', 'thumbnail_url') && $laravelProduct->thumbnail_url !== $fullUrl) {
                $needsUpdate = true;
            }

            if (Schema::hasColumn('products', 'thumbnail_mime_type') && $laravelProduct->thumbnail_mime_type !== $wpProduct->mime_type) {
                $needsUpdate = true;
            }

            if (Schema::hasColumn('products', 'wp_id') && $laravelProduct->wp_id !== $wpProduct->wp_id) {
                $needsUpdate = true;
            }

            if ($needsUpdate) {
                if ($dryRun) {
                    $this->info("[DRY-RUN] Would update Product #{$laravelProduct->id} ('{$laravelProduct->name}'):");
                    $this->info("   - Path: {$savedPath}");
                    $this->info("   - URL: {$fullUrl}");
                    if ($wpProduct->mime_type) {
                        $this->info("   - Mime: {$wpProduct->mime_type}");
                    }
                    $updatedCount++;
                } else {
                    $updateData = [
                        'thumbnail' => $savedPath,
                    ];

                    if (Schema::hasColumn('products', 'thumbnail_url')) {
                        $updateData['thumbnail_url'] = $fullUrl;
                    }

                    if (Schema::hasColumn('products', 'thumbnail_mime_type')) {
                        $updateData['thumbnail_mime_type'] = $wpProduct->mime_type;
                    }

                    if (Schema::hasColumn('products', 'wp_id')) {
                        $updateData['wp_id'] = $wpProduct->wp_id;
                    }

                    $laravelProduct->update($updateData);
                    $updatedCount++;
                }
            } else {
                $skippedCount++;
            }
        }

        $this->info("\nMigration Complete Summary:");
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Found in WP', $totalFound],
                [$dryRun ? 'Would Update' : 'Updated', $updatedCount],
                ['Skipped (Up to date/No media)', $skippedCount],
                ['Missing Laravel Product', $missingCount],
            ]
        );

        return self::SUCCESS;
    }
}
