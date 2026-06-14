<?php

namespace App\Providers;

use App\CMS\Themes\ThemeInstaller;
use App\CMS\Themes\FallbackThemeResolver;
use App\CMS\Themes\FallbackAdminLoginViewData;
use App\CMS\Themes\ThemeManager;
use Illuminate\Support\ServiceProvider;
use Throwable;

class ThemeServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FallbackThemeResolver::class);
        $this->app->singleton(FallbackAdminLoginViewData::class);
        $this->app->singleton(ThemeManager::class);
        $this->app->singleton(ThemeInstaller::class);
    }

    public function boot(ThemeManager $themeManager): void
    {
        try {
            $themeManager->registerActiveThemeViews();
        } catch (Throwable) {
            // Theme bootstrapping must never block the dashboard, console, or migrations.
        }
    }
}
