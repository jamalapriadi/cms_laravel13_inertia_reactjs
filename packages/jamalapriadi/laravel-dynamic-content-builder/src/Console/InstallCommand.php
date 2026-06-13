<?php

namespace Jamalapriadi\DynamicContentBuilder\Console;

use Illuminate\Console\Command;

class InstallCommand extends Command
{
    protected $signature = 'dynamic-content-builder:install {--force : Overwrite published files}';

    protected $description = 'Publish the Dynamic Content Builder package resources';

    public function handle(): int
    {
        $force = (bool) $this->option('force');

        $this->call('vendor:publish', [
            '--tag' => 'dynamic-content-builder-config',
            '--force' => $force,
        ]);

        $this->call('vendor:publish', [
            '--tag' => 'dynamic-content-builder-assets',
            '--force' => $force,
        ]);

        $this->call('vendor:publish', [
            '--tag' => 'dynamic-content-builder-migrations',
            '--force' => $force,
        ]);

        $this->newLine();
        $this->info('Dynamic Content Builder assets have been published.');
        $this->line('Next steps:');
        $this->line('1. Run `php artisan migrate`');
        $this->line('2. Run `php artisan storage:link` if your public storage link is missing');
        $this->line('3. Add the dashboard links you want into your app navigation');
        $this->line('4. Rebuild frontend assets with `npm run build` or `npm run dev`');

        return self::SUCCESS;
    }
}
