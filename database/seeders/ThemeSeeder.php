<?php

namespace Database\Seeders;

use App\CMS\Themes\FallbackThemeResolver;
use App\CMS\Themes\ThemeInstaller;
use App\Models\Theme;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

class ThemeSeeder extends Seeder
{
    public function run(): void
    {
        $themesWereEmpty = Theme::query()->count() === 0;

        app(ThemeInstaller::class)->syncInstalledThemes();
        $fallbackTheme = app(FallbackThemeResolver::class)->resolve();

        if (! $themesWereEmpty || ! $fallbackTheme instanceof Theme) {
            return;
        }

        Theme::query()->update(['is_active' => false]);
        $fallbackTheme->forceFill(['is_active' => true])->save();

        Cache::forever((string) config('themes.cache.active_theme_id'), $fallbackTheme->id);
    }
}
