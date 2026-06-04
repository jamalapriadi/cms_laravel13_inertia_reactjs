<?php

use App\Services\Cache\ListCacheService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('list-cache:clear {module? : Optional list cache module name}', function (ListCacheService $listCache): int {
    $module = $this->argument('module');

    $listCache->clear(is_string($module) && $module !== '' ? $module : null);

    $this->info($module ? "List cache module [{$module}] cleared." : 'All list cache modules cleared.');

    return 0;
})->purpose('Clear cached list/index data');
