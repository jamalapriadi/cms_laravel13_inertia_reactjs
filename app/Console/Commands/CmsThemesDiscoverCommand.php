<?php

namespace App\Console\Commands;

use App\CMS\Themes\ThemeInstaller;
use App\Models\Theme;
use Illuminate\Console\Command;

class CmsThemesDiscoverCommand extends Command
{
    protected $signature = 'cms:themes:discover';

    protected $description = 'Sync local CMS themes into the database and public theme assets directory';

    public function __construct(
        private readonly ThemeInstaller $themeInstaller,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $beforeCount = Theme::query()->count();

        $this->info('Discovering local themes...');

        $this->themeInstaller->syncInstalledThemes();

        $themes = Theme::query()
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get(['name', 'slug', 'version', 'is_active']);

        $discoveredCount = max($themes->count() - $beforeCount, 0);

        if ($themes->isEmpty()) {
            $this->warn('No valid themes were discovered.');

            return self::SUCCESS;
        }

        $this->table(
            ['Name', 'Slug', 'Version', 'Active'],
            $themes->map(fn (Theme $theme): array => [
                $theme->name,
                $theme->slug,
                $theme->version ?? '-',
                $theme->is_active ? 'yes' : 'no',
            ])->all(),
        );

        $this->info("Theme discovery complete. {$discoveredCount} new theme(s) synced.");

        return self::SUCCESS;
    }
}
