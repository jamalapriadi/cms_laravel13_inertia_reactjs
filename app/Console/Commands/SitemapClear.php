<?php

namespace App\Console\Commands;

use App\CMS\Sitemap\SitemapManager;
use Illuminate\Console\Command;

class SitemapClear extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sitemap:clear';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Clear all cached sitemap records';

    /**
     * Execute the console command.
     */
    public function handle(SitemapManager $sitemapManager): int
    {
        $this->info('Clearing sitemap cache...');
        $sitemapManager->clearCache();
        $this->info('Sitemap cache cleared successfully.');

        return self::SUCCESS;
    }
}
