<?php

namespace App\Observers;

use App\Services\Cache\ListCacheService;
use Illuminate\Database\Eloquent\Model;

class ListCacheObserver
{
    public function created(Model $model): void
    {
        $this->clearFor($model);
    }

    public function updated(Model $model): void
    {
        $this->clearFor($model);
    }

    public function deleted(Model $model): void
    {
        $this->clearFor($model);
    }

    public function restored(Model $model): void
    {
        $this->clearFor($model);
    }

    public function forceDeleted(Model $model): void
    {
        $this->clearFor($model);
    }

    private function clearFor(Model $model): void
    {
        $modules = config('list-cache.invalidation.'.$model::class, []);

        if ($modules === []) {
            return;
        }

        app(ListCacheService::class)->clearMany($modules);
    }
}
