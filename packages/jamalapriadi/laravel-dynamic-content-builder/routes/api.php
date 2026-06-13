<?php

use Illuminate\Support\Facades\Route;
use Jamalapriadi\DynamicContentBuilder\Http\Controllers\Api\DynamicContentController;

$prefix = trim((string) config('dynamic-content-builder.api.prefix', 'api/v1'), '/');
$middleware = config('dynamic-content-builder.api.middleware', ['api']);
$namePrefix = (string) config('dynamic-content-builder.api.name_prefix', 'api.v1.');

$route = Route::middleware($middleware)->name($namePrefix);

if ($prefix !== '') {
    $route = $route->prefix($prefix);
}

$route->group(function (): void {
    Route::get('content-types', [DynamicContentController::class, 'contentTypes'])->name('content-types.index');
    Route::get('content/{contentTypeSlug}', [DynamicContentController::class, 'index'])->name('content.index');
    Route::get('content/{contentTypeSlug}/{entrySlug}', [DynamicContentController::class, 'show'])->name('content.show');
});
