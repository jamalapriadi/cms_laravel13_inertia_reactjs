<?php

use App\Http\Controllers\Customer\Auth\CustomerAuthenticatedSessionController;
use App\Http\Controllers\Customer\Auth\CustomerEmailVerificationNotificationController;
use App\Http\Controllers\Customer\Auth\CustomerEmailVerificationPromptController;
use App\Http\Controllers\Customer\Auth\CustomerNewPasswordController;
use App\Http\Controllers\Customer\Auth\CustomerPasswordResetLinkController;
use App\Http\Controllers\Customer\Auth\CustomerRegisteredUserController;
use App\Http\Controllers\Customer\Auth\CustomerVerifyEmailController;
use App\Http\Controllers\Customer\CustomerDashboardController;
use App\Http\Controllers\Dashboard\Cms\PageTranslationController;
use App\Http\Controllers\Dashboard\Cms\PostTranslationController;
use App\Http\Controllers\Dashboard\KabupatenController;
use App\Http\Controllers\Dashboard\KecamatanController;
use App\Http\Controllers\Dashboard\KelurahanController;
use App\Http\Controllers\Dashboard\MediaController;
use App\Http\Controllers\Dashboard\MenuController;
use App\Http\Controllers\Dashboard\OptionController;
use App\Http\Controllers\Dashboard\PackageController;
use App\Http\Controllers\Dashboard\PageController;
use App\Http\Controllers\Dashboard\PostCategoryController;
use App\Http\Controllers\Dashboard\PostController;
use App\Http\Controllers\Dashboard\ProvinceController;
use App\Http\Controllers\Dashboard\SettingController;
use App\Http\Controllers\Dashboard\SiteContentController;
use App\Http\Controllers\Dashboard\TaxonomyController;
use App\Http\Controllers\Dashboard\ThemeController as DashboardThemeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Frontend\CategoryController as FrontendCategoryController;
use App\Http\Controllers\Frontend\HomeController as FrontendHomeController;
use App\Http\Controllers\Frontend\PageController as FrontendPageController;
use App\Http\Controllers\Frontend\ProductController as FrontendProductController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\Store\BannerSlideController;
use App\Http\Controllers\Store\BarcodeScannerController;
use App\Http\Controllers\Store\BrandController;
use App\Http\Controllers\Store\CartController;
use App\Http\Controllers\Store\CategoryController;
use App\Http\Controllers\Store\CustomerController;
use App\Http\Controllers\Store\FaqController;
use App\Http\Controllers\Store\IncomingGoodsController;
use App\Http\Controllers\Store\OrderController;
use App\Http\Controllers\Store\PaymentController;
use App\Http\Controllers\Store\ProductCollectionController;
use App\Http\Controllers\Store\ProductCollectionItemController;
use App\Http\Controllers\Store\ProductController;
use App\Http\Controllers\Store\ProductImageController;
use App\Http\Controllers\Store\ProductSpecificationController;
use App\Http\Controllers\Store\ProductStockUnitController;
use App\Http\Controllers\Store\ProductVariantController;
use App\Http\Controllers\Store\SearchOptionController;
use App\Http\Controllers\Store\ShippingController;
use App\Http\Controllers\Store\StockMovementController;
use App\Http\Controllers\Store\StockUnitBarcodeController;
use App\Http\Controllers\Store\SupplierController;
use App\Http\Controllers\Store\SupplierReturnController;
use App\Http\Controllers\Store\UnitController;
use App\Http\Controllers\Store\VariantItemController;
use App\Http\Controllers\User\PermissionController;
use App\Http\Controllers\User\RoleController;
use App\Http\Controllers\User\UserController;
use App\Http\Middleware\EnsureCustomerAuthFeatureEnabled;
use App\Http\Middleware\EnsureCustomerEmailVerified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use Laravel\Fortify\Http\Controllers\VerifyEmailController;

// Route::inertia('/', 'welcome', [
//     'canRegister' => Features::enabled(Features::registration()),
// ])->name('home');

Route::get('/', FrontendHomeController::class)->name('home');

Route::prefix('auth')->name('customer.auth.')->group(function () {
    Route::middleware('customer.guest')->group(function () {
        Route::middleware([EnsureCustomerAuthFeatureEnabled::class.':login'])->group(function () {
            Route::get('login', [CustomerAuthenticatedSessionController::class, 'create'])->name('login');
            Route::post('login', [CustomerAuthenticatedSessionController::class, 'store'])->name('login.store');
        });

        Route::middleware([EnsureCustomerAuthFeatureEnabled::class.':registration'])->group(function () {
            Route::get('register', [CustomerRegisteredUserController::class, 'create'])->name('register');
            Route::post('register', [CustomerRegisteredUserController::class, 'store'])->name('register.store');
        });

        Route::middleware([EnsureCustomerAuthFeatureEnabled::class.':password_reset'])->group(function () {
            Route::get('forgot-password', [CustomerPasswordResetLinkController::class, 'create'])->name('password.request');
            Route::post('forgot-password', [CustomerPasswordResetLinkController::class, 'store'])->name('password.email');
            Route::get('recovery-password/{token}', [CustomerNewPasswordController::class, 'create'])->name('password.reset');
            Route::post('recovery-password', [CustomerNewPasswordController::class, 'store'])->name('password.store');
        });
    });

    Route::middleware('customer.auth')->group(function () {
        Route::get('verify-email', CustomerEmailVerificationPromptController::class)
            ->name('verification.notice');

        Route::get('verify-email/{id}/{hash}', CustomerVerifyEmailController::class)
            ->middleware(['signed', 'throttle:6,1'])
            ->name('verification.verify');

        Route::post('email/verification-notification', CustomerEmailVerificationNotificationController::class)
            ->middleware('throttle:6,1')
            ->name('verification.send');

        Route::post('logout', [CustomerAuthenticatedSessionController::class, 'destroy'])
            ->name('logout');
    });
});

Route::prefix('customer')->name('customer.')->middleware(['customer.auth', EnsureCustomerEmailVerified::class])->group(function () {
    Route::get('dashboard', [CustomerDashboardController::class, 'index'])->name('dashboard');
});

Route::redirect('/onboard/login', '/auth/login', 301);
Route::redirect('/onboard/register', '/auth/register', 301);
Route::redirect('/onboard/forgot-password', '/auth/forgot-password', 301);
Route::get('/onboard/recovery-password', function (Request $request) {
    $token = trim((string) $request->query('token'));

    if ($token === '') {
        return redirect()->route('customer.auth.password.request');
    }

    return redirect()->route('customer.auth.password.reset', [
        'token' => $token,
        'email' => $request->query('email'),
    ]);
})->name('legacy.customer.password.reset');

Route::group(['prefix' => 'api'], function () {
    Route::get('/kabupaten/{provinsi}', [KelurahanController::class, 'getKabupaten']);
    Route::get('/kecamatan/{kabupaten}', [KelurahanController::class, 'getKecamatan']);
});

Route::group(['middleware' => ['auth', 'verified', 'dashboard.permission'], 'prefix' => 'my-admin/dashboard'], function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('provinces', ProvinceController::class);
    Route::resource('kabupatens', KabupatenController::class);
    Route::resource('kecamatans', KecamatanController::class);
    Route::resource('kelurahans', KelurahanController::class);

    Route::get('menus/{menu}/builder', [MenuController::class, 'builder'])->name('menus.builder');
    Route::put('menus/{menu}/builder', [MenuController::class, 'updateBuilder'])->name('menus.builder.update');
    Route::resource('menus', MenuController::class);

    Route::resource('roles', RoleController::class)->except(['show']);
    Route::resource('permissions', PermissionController::class)->except(['show']);
    Route::resource('users', UserController::class)->except(['show']);
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

    Route::get('posts/usage-guide', [PostController::class, 'usageGuide'])->name('posts.usage-guide');
    Route::resource('posts', PostController::class);
    Route::resource('pages', PageController::class)->except(['show']);
    Route::get('themes', [DashboardThemeController::class, 'index'])->name('themes.index');
    Route::post('themes', [DashboardThemeController::class, 'store'])->name('themes.store');
    Route::get('themes/{theme}/customize', [DashboardThemeController::class, 'customize'])->name('themes.customize');
    Route::put('themes/{theme}/customize', [DashboardThemeController::class, 'updateSettings'])->name('themes.customize.update');
    Route::post('themes/{theme}/activate', [DashboardThemeController::class, 'activate'])->name('themes.activate');
    Route::delete('themes/{theme}', [DashboardThemeController::class, 'destroy'])->name('themes.destroy');
    Route::prefix('cms/pages/{page}/translations')->name('dashboard.cms.pages.translations.')->group(function () {
        Route::get('/', [PageTranslationController::class, 'index'])->name('index');
        Route::get('/{language}', [PageTranslationController::class, 'edit'])->name('edit');
        Route::put('/{language}', [PageTranslationController::class, 'update'])->name('update');
    });
    Route::prefix('cms/posts/{post}/translations')->name('dashboard.cms.posts.translations.')->group(function () {
        Route::get('/', [PostTranslationController::class, 'index'])->name('index');
        Route::get('/{language}', [PostTranslationController::class, 'edit'])->name('edit');
        Route::put('/{language}', [PostTranslationController::class, 'update'])->name('update');
    });

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
    Route::post('ecommerce/product-stock-units/{productStockUnit}/generate-barcode', [StockUnitBarcodeController::class, 'generate'])->name('product-stock-units.barcode.generate');
    Route::post('ecommerce/product-stock-units/{productStockUnit}/regenerate-barcode', [StockUnitBarcodeController::class, 'regenerate'])->name('product-stock-units.barcode.regenerate');
    Route::post('ecommerce/product-stock-units/bulk-generate-barcode', [StockUnitBarcodeController::class, 'bulkGenerate'])->name('product-stock-units.bulk-generate-barcode');
    Route::get('ecommerce/product-stock-units/barcodes/print', [StockUnitBarcodeController::class, 'print'])->name('product-stock-units.barcodes.print');
    Route::post('ecommerce/product-stock-units/barcodes/print-selected', [StockUnitBarcodeController::class, 'printSelected'])->name('product-stock-units.barcodes.print-selected');
    Route::get('ecommerce/incoming-goods/{incomingGood}/barcodes/print', [StockUnitBarcodeController::class, 'printByIncomingGood'])->name('incoming-goods.barcodes.print');
    Route::get('ecommerce/barcode-scanner', [BarcodeScannerController::class, 'scanner'])->name('barcode-scanner.index');
    Route::post('ecommerce/barcode-scanner/search', [BarcodeScannerController::class, 'scanSearch'])->name('barcode-scanner.search');
    Route::resource('ecommerce/product-images', ProductImageController::class)->names('product-images');
    Route::get('ecommerce/product-collections/options/products', [ProductCollectionController::class, 'optionsProducts'])->name('product-collections.options.products');
    Route::post('ecommerce/product-collections/{productCollection}/items', [ProductCollectionItemController::class, 'store'])->name('product-collections.items.store');
    Route::put('ecommerce/product-collections/{productCollection}/items/{item}', [ProductCollectionItemController::class, 'update'])->name('product-collections.items.update');
    Route::delete('ecommerce/product-collections/{productCollection}/items/{item}', [ProductCollectionItemController::class, 'destroy'])->name('product-collections.items.destroy');
    Route::resource('ecommerce/product-collections', ProductCollectionController::class)
        ->parameters(['product-collections' => 'productCollection'])
        ->names('product-collections');
    Route::resource('ecommerce/product-specifications', ProductSpecificationController::class)->names('product-specifications');
    Route::resource('ecommerce/faqs', FaqController::class)
        ->parameters(['faqs' => 'faq'])
        ->except(['show'])
        ->names('faqs');
    Route::resource('ecommerce/banner-slides', BannerSlideController::class)
        ->parameters(['banner-slides' => 'bannerSlide'])
        ->except(['show'])
        ->names('banner-slides');
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
            Route::get('/site-contents/usage', [SiteContentController::class, 'usage'])->name('config.site-contents.usage');
            Route::resource('/site-contents', SiteContentController::class)
                ->parameters(['site-contents' => 'siteContent'])
                ->except(['show'])
                ->names('config.site-contents');
            Route::get('/reading', 'reading')->name('config.reading');
        });
    });

    Route::resource('options', OptionController::class)->except(['create', 'edit', 'show']);

    Route::controller(MediaController::class)->group(function () {
        Route::get('/media', 'index')->name('dashboard.media');
        Route::get('/media/library', 'library')->name('dashboard.media.library');
        Route::get('/media/create', 'create')->name('dashboard.media.create');
        Route::post('/media', 'store')->name('dashboard.media.store');
        Route::post('/media/upload', 'upload')->name('dashboard.media.upload');
        Route::post('/media/json', 'store_json')->name('dashboard.media.json');
        Route::delete('/media/storage-file', 'destroyStorageFile')->name('dashboard.media.storage-file.destroy');
        Route::put('/media/{medium}', 'update')->name('dashboard.media.update');
        Route::delete('/media/{medium}', 'destroy')->name('dashboard.media.destroy');
        Route::post('/upload-image', 'store_image')->name('dashboard.media.store-image');
    });
});

Route::get('/theme-preview/{theme:slug}', [FrontendHomeController::class, 'preview'])->name('themes.preview');
Route::get('/products', [FrontendProductController::class, 'index'])->name('frontend.products.index');
Route::get('/products/{slug}', [FrontendProductController::class, 'show'])->name('frontend.products.show');
Route::get('/category/{slug}', [FrontendCategoryController::class, 'show'])->name('frontend.categories.show');

require __DIR__.'/settings.php';

Route::redirect('/login', '/my-admin/login', 301);
Route::redirect('/logout', '/my-admin/logout', 301);

if (Features::enabled(Features::resetPasswords())) {
    Route::redirect('/forgot-password', '/my-admin/forgot-password', 301);

    Route::get('/reset-password/{token}', function (Request $request, string $token) {
        $target = "/my-admin/reset-password/{$token}";
        $queryString = $request->getQueryString();

        return redirect()->to($queryString ? "{$target}?{$queryString}" : $target, 301);
    })->name('legacy.password.reset');
}

if (Features::enabled(Features::registration())) {
    Route::redirect('/register', '/my-admin/register', 301);
}

if (Features::enabled(Features::emailVerification())) {
    Route::redirect('/email/verify', '/my-admin/email/verify', 301);

    Route::get('/email/verify/{id}/{hash}', function (Request $request) {
        return app(VerifyEmailController::class)($request);
    })
        ->middleware(['auth', 'signed', 'throttle:6,1'])
        ->name('legacy.verification.verify');
}

if (Features::enabled(Features::twoFactorAuthentication())) {
    Route::redirect('/two-factor-challenge', '/my-admin/two-factor-challenge', 301);
}

Route::get('/dashboard/{path?}', function (Request $request, ?string $path = null) {
    $target = '/my-admin/dashboard'.($path ? "/{$path}" : '');
    $queryString = $request->getQueryString();

    return redirect()->to($queryString ? "{$target}?{$queryString}" : $target, 301);
})->where('path', '.*');

Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap.index');
Route::get('/sitemaps/{type}.xml', [SitemapController::class, 'show'])->name('sitemap.show');

Route::get('/robots.txt', function () {
    $content = '';
    if (file_exists(public_path('robots.txt'))) {
        $content = file_get_contents(public_path('robots.txt'));
    }
    if (empty($content)) {
        $content = "User-agent: *\nDisallow:\n";
    }
    if (! str_contains($content, 'Sitemap:')) {
        $sitemapUrl = rtrim(config('app.url') ?: 'http://localhost:8000', '/').'/sitemap.xml';
        $content = rtrim($content)."\n\nSitemap: ".$sitemapUrl."\n";
    }

    return response($content, 200, ['Content-Type' => 'text/plain']);
});

Route::get('/{slug}', [FrontendPageController::class, 'show'])
    ->where('slug', '^(?!my-admin|auth|customer|api|onboard|theme-preview|login|logout|register|forgot-password|reset-password|email|two-factor-challenge|dashboard|settings|sitemap\.xml|sitemaps|robots\.txt).+')
    ->name('frontend.pages.show');
