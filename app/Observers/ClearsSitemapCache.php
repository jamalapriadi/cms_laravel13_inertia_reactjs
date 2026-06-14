<?php

namespace App\Observers;

use App\CMS\Sitemap\SitemapManager;
use Illuminate\Database\Eloquent\Model;

trait ClearsSitemapCache
{
    /**
     * Handle the model "created" event.
     */
    public function created(Model $model): void
    {
        app(SitemapManager::class)->clearCache();
    }

    /**
     * Handle the model "updated" event.
     */
    public function updated(Model $model): void
    {
        if ($model->wasChanged(['slug', 'status', 'is_publish', 'is_active', 'published_at', 'start_at', 'end_at'])) {
            app(SitemapManager::class)->clearCache();
        }
    }

    /**
     * Handle the model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        app(SitemapManager::class)->clearCache();
    }

    /**
     * Handle the model "restored" event.
     */
    public function restored(Model $model): void
    {
        app(SitemapManager::class)->clearCache();
    }

    /**
     * Handle the model "force deleted" event.
     */
    public function forceDeleted(Model $model): void
    {
        app(SitemapManager::class)->clearCache();
    }
}
