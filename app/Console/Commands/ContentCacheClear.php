<?php

namespace App\Console\Commands;

use App\Services\Cache\ContentCacheService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ContentCacheClear extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'content-cache:clear 
                            {--slug= : The content type slug to clear} 
                            {--locale= : The locale to clear}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear dynamic content API cache';

    /**
     * Execute the console command.
     */
    public function handle(ContentCacheService $cacheService): int
    {
        $slug = $this->option('slug');
        $locale = $this->option('locale');

        if ($slug && $locale) {
            if ($cacheService->supportsTags()) {
                Cache::tags(["content:{$slug}", "locale:{$locale}"])->flush();
            } else {
                $keys = Cache::get('content-cache:registry', []);
                $remainingKeys = [];
                $patternSlug = "api:content:{$slug}:";
                $patternLocale = ":locale:{$locale}:";

                foreach ($keys as $key) {
                    if (str_contains($key, $patternSlug) && str_contains($key, $patternLocale)) {
                        Cache::forget($key);
                    } else {
                        $remainingKeys[] = $key;
                    }
                }
                Cache::forever('content-cache:registry', $remainingKeys);
            }
            $this->info("Cleared cache for content type slug [{$slug}] and locale [{$locale}].");
        } elseif ($slug) {
            $cacheService->clearBySlug($slug);
            $this->info("Cleared cache for content type slug [{$slug}].");
        } elseif ($locale) {
            $cacheService->clearByLocale($locale);
            $this->info("Cleared cache for locale [{$locale}].");
        } else {
            $cacheService->clearAll();
            $this->info('Cleared all dynamic content API cache.');
        }

        return 0;
    }
}
