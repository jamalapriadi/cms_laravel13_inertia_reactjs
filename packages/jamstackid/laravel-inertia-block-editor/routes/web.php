<?php

use Illuminate\Support\Facades\Route;
use JamstackId\InertiaBlockEditor\Http\Controllers\BlockTreeController;

if (config('inertia-block-editor.routes.enabled', false)) {
    Route::middleware(config('inertia-block-editor.routes.middleware', ['web', 'auth']))
        ->prefix(config('inertia-block-editor.routes.prefix', 'dashboard/block-editor'))
        ->name(config('inertia-block-editor.routes.name', 'block-editor.'))
        ->group(function () {
            Route::post('blocks', [BlockTreeController::class, 'store'])->name('blocks.store');
        });
}
