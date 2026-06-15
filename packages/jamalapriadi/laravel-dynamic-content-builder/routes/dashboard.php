<?php

use App\Http\Controllers\Dashboard\ContentTypeController;
use App\Http\Controllers\Dashboard\CustomFieldGroupController;
use App\Http\Controllers\Dashboard\DynamicContentEntryController;
use Illuminate\Support\Facades\Route;
use Jamalapriadi\DynamicContentBuilder\Http\Controllers\Dashboard\MediaLibraryController;

$prefix = trim((string) config('dynamic-content-builder.dashboard.prefix', 'dashboard'), '/');
$middleware = config('dynamic-content-builder.dashboard.middleware', ['web', 'auth']);

$route = Route::middleware($middleware);

if ($prefix !== '') {
    $route = $route->prefix($prefix);
}

$route->group(function (): void {
    Route::get('content-types', [ContentTypeController::class, 'index'])
        ->middleware('dynamic-content-builder.authorize:content-types.view')
        ->name('content-types.index');
    Route::get('content-types/create', [ContentTypeController::class, 'create'])
        ->middleware('dynamic-content-builder.authorize:content-types.create')
        ->name('content-types.create');
    Route::post('content-types', [ContentTypeController::class, 'store'])
        ->middleware('dynamic-content-builder.authorize:content-types.create')
        ->name('content-types.store');
    Route::get('content-types/{contentType}/edit', [ContentTypeController::class, 'edit'])
        ->middleware('dynamic-content-builder.authorize:content-types.edit')
        ->name('content-types.edit');
    Route::put('content-types/{contentType}', [ContentTypeController::class, 'update'])
        ->middleware('dynamic-content-builder.authorize:content-types.edit')
        ->name('content-types.update');
    Route::delete('content-types/{contentType}', [ContentTypeController::class, 'destroy'])
        ->middleware('dynamic-content-builder.authorize:content-types.delete')
        ->name('content-types.destroy');

    Route::get('custom-fields', [CustomFieldGroupController::class, 'index'])
        ->middleware('dynamic-content-builder.authorize:custom-fields.view')
        ->name('custom-fields.index');
    Route::get('custom-fields/create', [CustomFieldGroupController::class, 'create'])
        ->middleware('dynamic-content-builder.authorize:custom-fields.create')
        ->name('custom-fields.create');
    Route::post('custom-fields', [CustomFieldGroupController::class, 'store'])
        ->middleware('dynamic-content-builder.authorize:custom-fields.create')
        ->name('custom-fields.store');
    Route::get('custom-fields/{customFieldGroup}/edit', [CustomFieldGroupController::class, 'edit'])
        ->middleware('dynamic-content-builder.authorize:custom-fields.edit')
        ->name('custom-fields.edit');
    Route::put('custom-fields/{customFieldGroup}', [CustomFieldGroupController::class, 'update'])
        ->middleware('dynamic-content-builder.authorize:custom-fields.edit')
        ->name('custom-fields.update');
    Route::delete('custom-fields/{customFieldGroup}', [CustomFieldGroupController::class, 'destroy'])
        ->middleware('dynamic-content-builder.authorize:custom-fields.delete')
        ->name('custom-fields.destroy');
    Route::post('custom-fields/{customFieldGroup}/fields', [CustomFieldGroupController::class, 'storeField'])
        ->middleware('dynamic-content-builder.authorize:custom-fields.create')
        ->name('custom-fields.fields.store');
    Route::put('custom-fields/{customFieldGroup}/fields/{customField}', [CustomFieldGroupController::class, 'updateField'])
        ->middleware('dynamic-content-builder.authorize:custom-fields.edit')
        ->name('custom-fields.fields.update');
    Route::delete('custom-fields/{customFieldGroup}/fields/{customField}', [CustomFieldGroupController::class, 'destroyField'])
        ->middleware('dynamic-content-builder.authorize:custom-fields.delete')
        ->name('custom-fields.fields.destroy');
    Route::patch('custom-fields/{customFieldGroup}/fields/{customField}/move', [CustomFieldGroupController::class, 'moveField'])
        ->middleware('dynamic-content-builder.authorize:custom-fields.edit')
        ->name('custom-fields.fields.move');

    Route::get('dynamic-content-builder/media', [MediaLibraryController::class, 'index'])
        ->middleware('dynamic-content-builder.authorize:dynamic-contents.view')
        ->name('dynamic-content-builder.media.index');
    Route::post('dynamic-content-builder/media', [MediaLibraryController::class, 'store'])
        ->middleware('dynamic-content-builder.authorize:dynamic-contents.create')
        ->name('dynamic-content-builder.media.store');

    Route::prefix('content/{contentType:slug}')
        ->name('dynamic-content.')
        ->group(function (): void {
            Route::get('/', [DynamicContentEntryController::class, 'index'])
                ->middleware('dynamic-content-builder.authorize:dynamic-contents.view')
                ->name('index');
            Route::get('/create', [DynamicContentEntryController::class, 'create'])
                ->middleware('dynamic-content-builder.authorize:dynamic-contents.create')
                ->name('create');
            Route::post('/', [DynamicContentEntryController::class, 'store'])
                ->middleware('dynamic-content-builder.authorize:dynamic-contents.create')
                ->name('store');
            Route::get('/{contentEntry}/edit', [DynamicContentEntryController::class, 'edit'])
                ->middleware('dynamic-content-builder.authorize:dynamic-contents.edit')
                ->name('edit');
            Route::put('/{contentEntry}', [DynamicContentEntryController::class, 'update'])
                ->middleware('dynamic-content-builder.authorize:dynamic-contents.edit')
                ->name('update');
            Route::delete('/{contentEntry}', [DynamicContentEntryController::class, 'destroy'])
                ->middleware('dynamic-content-builder.authorize:dynamic-contents.delete')
                ->name('destroy');
        });
});
