<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('my-admin')->group(function () {
    Route::middleware(['auth'])->group(function () {
        Route::get('settings', fn () => redirect('/my-admin/settings/profile', 301));

        Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    });

    Route::middleware(['auth', 'verified'])->group(function () {
        Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

        Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');

        Route::put('settings/password', [SecurityController::class, 'update'])
            ->middleware('throttle:6,1')
            ->name('user-password.update');

        Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
    });
});

Route::get('/settings/{path?}', function (Request $request, ?string $path = null) {
    $target = '/my-admin/settings'.($path ? "/{$path}" : '/profile');
    $queryString = $request->getQueryString();

    return redirect()->to($queryString ? "{$target}?{$queryString}" : $target, 301);
})->where('path', '.*');
