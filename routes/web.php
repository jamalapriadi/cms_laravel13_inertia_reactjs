<?php

use App\Http\Controllers\Dashboard\KabupatenController;
use App\Http\Controllers\Dashboard\KecamatanController;
use App\Http\Controllers\Dashboard\KelurahanController;
use App\Http\Controllers\Dashboard\MediaController;
use App\Http\Controllers\Dashboard\MenuController;
use App\Http\Controllers\Dashboard\OptionController;
use App\Http\Controllers\Dashboard\PackageController;
use App\Http\Controllers\Dashboard\PostCategoryController;
use App\Http\Controllers\Dashboard\PostController;
use App\Http\Controllers\Dashboard\ProvinceController;
use App\Http\Controllers\Dashboard\SettingController;
use App\Http\Controllers\Dashboard\TaxonomyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Store\BrandController;
use App\Http\Controllers\Store\CartController;
use App\Http\Controllers\Store\CategoryController;
use App\Http\Controllers\Store\OrderController;
use App\Http\Controllers\Store\PaymentController;
use App\Http\Controllers\Store\ProductController;
use App\Http\Controllers\Store\ProductImageController;
use App\Http\Controllers\Store\ProductSpecificationController;
use App\Http\Controllers\Store\ProductVariantController;
use App\Http\Controllers\Store\ShippingController;
use App\Http\Controllers\Store\StockMovementController;
use App\Http\Controllers\Store\UnitController;
use App\Http\Controllers\User\PermissionController;
use App\Http\Controllers\User\RoleController;
use App\Http\Controllers\User\UserController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

// Route::inertia('/', 'welcome', [
//     'canRegister' => Features::enabled(Features::registration()),
// ])->name('home');

Route::middleware('guest')->group(function () {

    Route::inertia('/', 'auth/login')->name('home');

});

Route::group(['prefix' => 'api'], function () {
    Route::get('/kabupaten/{provinsi}', [KelurahanController::class, 'getKabupaten']);
    Route::get('/kecamatan/{kabupaten}', [KelurahanController::class, 'getKecamatan']);
});

Route::group(['middleware' => ['auth', 'verified'], 'prefix' => 'dashboard'], function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('provinces', ProvinceController::class);
    Route::resource('kabupatens', KabupatenController::class);
    Route::resource('kecamatans', KecamatanController::class);
    Route::resource('kelurahans', KelurahanController::class);

    Route::resource('menus', MenuController::class);

    Route::resource('roles', RoleController::class);
    Route::resource('permissions', PermissionController::class);
    Route::resource('users', UserController::class);
    Route::patch('/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');

    Route::resource('post-categories', PostCategoryController::class);
    Route::controller(TaxonomyController::class)->group(function () {
        Route::get('taxonomies/{taxonomy}', 'index')->name('taxonomies.index');
        Route::get('taxonomies/{taxonomy}/create', 'create')->name('taxonomies.create');
        Route::post('taxonomies/{taxonomy}', 'store')->name('taxonomies.store');
        Route::get('taxonomies/{taxonomy}/{termTaxonomy}/edit', 'edit')->name('taxonomies.edit');
        Route::put('taxonomies/{taxonomy}/{termTaxonomy}', 'update')->name('taxonomies.update');
        Route::delete('taxonomies/{taxonomy}/{termTaxonomy}', 'destroy')->name('taxonomies.destroy');
    });

    Route::resource('posts', PostController::class);

    Route::resource('packages', PackageController::class);
    Route::resource('brands', BrandController::class);
    Route::resource('units', UnitController::class);
    Route::resource('ecommerce/categories', CategoryController::class)->names('categories');
    Route::resource('ecommerce/products', ProductController::class)->names('products');
    Route::resource('ecommerce/product-variants', ProductVariantController::class)->names('product-variants');
    Route::resource('ecommerce/product-images', ProductImageController::class)->names('product-images');
    Route::resource('ecommerce/product-specifications', ProductSpecificationController::class)->names('product-specifications');
    Route::delete('ecommerce/carts/{cart}/items/{item}', [CartController::class, 'destroyItem'])->name('carts.destroy-item');
    Route::resource('ecommerce/carts', CartController::class)->names('carts');
    Route::resource('ecommerce/payments', PaymentController::class)->only(['index', 'show'])->names('payments');
    Route::resource('ecommerce/stock-movements', StockMovementController::class)->names('stock-movements');
    Route::resource('ecommerce/shipping', ShippingController::class)->names('shippings');

    Route::get('orders/{order}/receipt', [OrderController::class, 'receipt'])->name('orders.receipt');
    Route::resource('orders', OrderController::class)->names('orders');

    Route::group(['prefix' => 'config'], function () {
        Route::controller(SettingController::class)->group(function () {
            Route::get('/main', 'index')->name('config.main');
            Route::get('/general', 'general')->name('config.general');
            Route::get('/preferences', 'preferences')->name('config.preferences');
            Route::get('/management', 'management')->name('config.management');
            Route::get('/customer', 'customer')->name('config.customer');
            Route::get('/media', 'media')->name('config.media');
            Route::get('/socialite', 'socialite')->name('config.socialite');
            Route::get('/language', 'language')->name('config.language');
            Route::post('/language/update', 'updateLanguage')->name('config.language.update');
            Route::get('/reading', 'reading')->name('config.reading');
        });
    });

    Route::resource('options', OptionController::class)->except(['create', 'edit', 'show']);

    Route::controller(MediaController::class)->group(function () {
        Route::get('/media', 'index')->name('dashboard.media');
        Route::get('/media/create', 'create')->name('dashboard.media.create');
        Route::post('/media', 'store');
        Route::post('/media/upload', 'upload');
        Route::post('/media/json', 'store_json');
        Route::put('/media/{medium}', 'update');
        Route::delete('/media/{medium}', 'destroy');
        Route::post('/upload-image', 'store_image');
    });
});

require __DIR__.'/settings.php';
