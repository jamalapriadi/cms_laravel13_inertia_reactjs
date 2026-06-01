<?php

use App\Http\Controllers\Customer\AuthController as CustomerAuthController;
use App\Http\Controllers\Customer\DashboardController as CustomerDashboardController;
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
use App\Http\Controllers\Store\CustomerController;
use App\Http\Controllers\Store\IncomingGoodsController;
use App\Http\Controllers\Store\OrderController;
use App\Http\Controllers\Store\PaymentController;
use App\Http\Controllers\Store\ProductController;
use App\Http\Controllers\Store\ProductImageController;
use App\Http\Controllers\Store\ProductSpecificationController;
use App\Http\Controllers\Store\ProductStockUnitController;
use App\Http\Controllers\Store\ProductVariantController;
use App\Http\Controllers\Store\SearchOptionController;
use App\Http\Controllers\Store\ShippingController;
use App\Http\Controllers\Store\StockMovementController;
use App\Http\Controllers\Store\SupplierController;
use App\Http\Controllers\Store\SupplierReturnController;
use App\Http\Controllers\Store\UnitController;
use App\Http\Controllers\Store\VariantItemController;
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

Route::middleware('guest:customer')->prefix('onboard')->group(function () {
    Route::get('login', [CustomerAuthController::class, 'login'])->name('customer.login');
    Route::post('login', [CustomerAuthController::class, 'authenticate'])->name('customer.login.store');
    Route::get('register', [CustomerAuthController::class, 'register'])->name('customer.register');
    Route::post('register', [CustomerAuthController::class, 'store'])->name('customer.register.store');
    Route::get('forgot-password', [CustomerAuthController::class, 'forgotPassword'])->name('customer.password.request');
    Route::post('forgot-password', [CustomerAuthController::class, 'sendResetLink'])->name('customer.password.email');
    Route::get('recovery-password', [CustomerAuthController::class, 'resetPassword'])->name('customer.password.reset');
    Route::post('recovery-password', [CustomerAuthController::class, 'updatePassword'])->name('customer.password.update');
});

Route::middleware('auth:customer')->prefix('customer')->group(function () {
    Route::get('dashboard', CustomerDashboardController::class)->name('customer.dashboard');
    Route::post('logout', [CustomerAuthController::class, 'logout'])->name('customer.logout');
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

    Route::get('menus/{menu}/builder', [MenuController::class, 'builder'])->name('menus.builder');
    Route::put('menus/{menu}/builder', [MenuController::class, 'updateBuilder'])->name('menus.builder.update');
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
    Route::get('ecommerce/search-options', SearchOptionController::class)->name('ecommerce.search-options');
    Route::resource('brands', BrandController::class);
    Route::resource('units', UnitController::class);
    Route::resource('ecommerce/categories', CategoryController::class)->names('categories');
    Route::post('ecommerce/products/import', [ProductController::class, 'import'])->name('products.import');
    Route::get('ecommerce/products/template', [ProductController::class, 'template'])->name('products.template');
    Route::get('ecommerce/products/export', [ProductController::class, 'export'])->name('products.export');
    Route::resource('ecommerce/products', ProductController::class)->names('products');
    Route::resource('ecommerce/product-variants', ProductVariantController::class)->names('product-variants');
    Route::resource('ecommerce/variant-items', VariantItemController::class)->names('variant-items');
    Route::resource('ecommerce/product-stock-units', ProductStockUnitController::class)->names('product-stock-units');
    Route::resource('ecommerce/product-images', ProductImageController::class)->names('product-images');
    Route::resource('ecommerce/product-specifications', ProductSpecificationController::class)->names('product-specifications');
    Route::patch('ecommerce/customers/{customer}/toggle-login', [CustomerController::class, 'toggleLogin'])->name('customers.toggle-login');
    Route::post('ecommerce/customers/{customer}/reset-password', [CustomerController::class, 'resetPassword'])->name('customers.reset-password');
    Route::resource('ecommerce/customers', CustomerController::class)->only(['index', 'show', 'destroy'])->names('customers');
    Route::delete('ecommerce/carts/{cart}/items/{item}', [CartController::class, 'destroyItem'])->name('carts.destroy-item');
    Route::resource('ecommerce/carts', CartController::class)->names('carts');
    Route::resource('ecommerce/payments', PaymentController::class)->only(['index', 'show'])->names('payments');
    Route::resource('ecommerce/stock-movements', StockMovementController::class)->names('stock-movements');
    Route::resource('ecommerce/shipping', ShippingController::class)->names('shippings');
    Route::resource('ecommerce/suppliers', SupplierController::class)->names('suppliers');
    Route::resource('ecommerce/incoming-goods', IncomingGoodsController::class)->names('incoming-goods');
    Route::resource('ecommerce/supplier-returns', SupplierReturnController::class)->names('supplier-returns');

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
        Route::get('/media/library', 'library')->name('dashboard.media.library');
        Route::get('/media/create', 'create')->name('dashboard.media.create');
        Route::post('/media', 'store');
        Route::post('/media/upload', 'upload');
        Route::post('/media/json', 'store_json');
        Route::delete('/media/storage-file', 'destroyStorageFile')->name('dashboard.media.storage-file.destroy');
        Route::put('/media/{medium}', 'update');
        Route::delete('/media/{medium}', 'destroy');
        Route::post('/upload-image', 'store_image');
    });
});

require __DIR__.'/settings.php';
