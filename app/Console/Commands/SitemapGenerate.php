<?php

namespace App\Console\Commands;

use App\CMS\Sitemap\SitemapManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SitemapGenerate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sitemap:generate';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Warm up sitemap cache';

    /**
     * Execute the console command.
     */
    public function handle(SitemapManager $sitemapManager): int
    {
        $this->info('Warming up sitemap cache...');

        $sitemapManager->clearCache();

        $ttl = config('cms_sitemap.cache_ttl');

        $this->info('Generating main sitemap...');
        $mainXml = config('cms_sitemap.sitemap_index')
            ? $sitemapManager->generateIndex()
            : $sitemapManager->generateFlatSitemap();

        Cache::put('cms.sitemap.index', $mainXml, $ttl);

        if (config('cms_sitemap.sitemap_index')) {
            $types = ['pages', 'posts', 'products', 'categories', 'brands', 'collections'];
            foreach ($types as $type) {
                if (config("cms_sitemap.include.{$type}")) {
                    $this->info("Generating sitemap for type: {$type}...");
                    $typeXml = $sitemapManager->generateUrlSet($type);
                    Cache::put("cms.sitemap.{$type}", $typeXml, $ttl);
                }
            }
        }

        $this->info('Sitemap cache warmed up successfully.');

        return self::SUCCESS;
    }
}
