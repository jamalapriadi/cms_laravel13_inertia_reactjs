<?php

use App\Http\Controllers\Api\V1\BannerSlideController;
use App\Http\Controllers\Api\V1\BrandController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\Customer\CustomerAuthController;
use App\Http\Controllers\Api\V1\FaqController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\HomeController;
use App\Http\Controllers\Api\V1\KabupatenController;
use App\Http\Controllers\Api\V1\KecamatanController;
use App\Http\Controllers\Api\V1\KelurahanController;
use App\Http\Controllers\Api\V1\MenuController;
use App\Http\Controllers\Api\V1\OpenApiController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PageController;
use App\Http\Controllers\Api\V1\PostController;
use App\Http\Controllers\Api\V1\ProductCollectionController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProvinceController;
use App\Http\Controllers\Api\V1\SiteContentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::get('/', [HealthController::class, 'info'])->name('info');
    Route::get('openapi.json', OpenApiController::class)->name('openapi');
    Route::get('health', [HealthController::class, 'health'])->name('health');

    Route::get('home', HomeController::class)->name('home');
    Route::get('menus/{slug}', [MenuController::class, 'show'])->name('menus.show');
    Route::get('pages', [PageController::class, 'index'])->name('pages.index');
    Route::get('pages/{slug}', [PageController::class, 'show'])->name('pages.show');
    Route::get('posts', [PostController::class, 'index'])->name('posts.index');
    Route::get('posts/{slug}', [PostController::class, 'show'])->name('posts.show');
    Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('category/{slug}', [CategoryController::class, 'showBySlug'])->name('category.show');
    Route::get('categories/{slug}', [CategoryController::class, 'showBySlug'])->name('categories.show');
    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::get('products/{slug}', [ProductController::class, 'show'])->name('products.show');
    Route::get('brands', [BrandController::class, 'index'])->name('brands.index');
    Route::get('brand/{slug}', [BrandController::class, 'showBySlug'])->name('brand.show');
    Route::get('brands/{slug}', [BrandController::class, 'showBySlug'])->name('brands.show');
    Route::get('banner-slides', [BannerSlideController::class, 'index'])->name('banner-slides.index');
    Route::get('product-collections', [ProductCollectionController::class, 'index'])->name('product-collections.index');
    Route::get('product-collection/{slug}', [ProductCollectionController::class, 'showBySlug'])->name('product-collection.show');
    Route::get('product-collections/{slug}', [ProductCollectionController::class, 'showBySlug'])->name('product-collections.show');
    Route::get('faqs', [FaqController::class, 'index'])->name('faqs.index');
    Route::get('site-contents', [SiteContentController::class, 'index'])->name('site-contents.index');
    Route::get('site-contents/{group}', [SiteContentController::class, 'group'])->name('site-contents.group');

    Route::get('provinces', [ProvinceController::class, 'index'])->name('provinces.index');
    Route::get('provinces/{province}', [ProvinceController::class, 'show'])->name('provinces.show');
    Route::get('provinces/{province}/kabupatens', [ProvinceController::class, 'kabupatens'])->name('provinces.kabupatens');

    Route::get('kabupatens', [KabupatenController::class, 'index'])->name('kabupatens.index');
    Route::get('kabupatens/{kabupaten}', [KabupatenController::class, 'show'])->name('kabupatens.show');
    Route::get('kabupatens/{kabupaten}/kecamatans', [KabupatenController::class, 'kecamatans'])->name('kabupatens.kecamatans');

    Route::get('kecamatans', [KecamatanController::class, 'index'])->name('kecamatans.index');
    Route::get('kecamatans/{kecamatan}', [KecamatanController::class, 'show'])->name('kecamatans.show');
    Route::get('kecamatans/{kecamatan}/kelurahans', [KecamatanController::class, 'kelurahans'])->name('kecamatans.kelurahans');

    Route::get('kelurahans', [KelurahanController::class, 'index'])->name('kelurahans.index');
    Route::get('kelurahans/{kelurahan}', [KelurahanController::class, 'show'])->name('kelurahans.show');

    Route::get('cart', [CartController::class, 'show'])->name('cart.show');
    Route::post('cart/items', [CartController::class, 'store'])->name('cart.items.store');
    Route::put('cart/items/{item}', [CartController::class, 'update'])->name('cart.items.update');
    Route::patch('cart/items/{item}', [CartController::class, 'patch'])->name('cart.items.patch');
    Route::delete('cart/items/{item}', [CartController::class, 'destroy'])->name('cart.items.destroy');
    Route::delete('cart', [CartController::class, 'clear'])->name('cart.clear');

    Route::prefix('customer')->name('customer.')->group(function (): void {
        Route::post('register', [CustomerAuthController::class, 'register'])
            ->middleware('throttle:5,1')
            ->name('register');
        Route::post('login', [CustomerAuthController::class, 'login'])
            ->middleware('throttle:5,1')
            ->name('login');
        Route::post('verify-otp', [CustomerAuthController::class, 'verifyOtp'])
            ->middleware('throttle:10,1')
            ->name('verify-otp');
        Route::post('resend-otp', [CustomerAuthController::class, 'resendOtp'])
            ->middleware('throttle:3,1')
            ->name('resend-otp');
        Route::post('forgot-password', [CustomerAuthController::class, 'forgotPassword'])
            ->middleware('throttle:5,1')
            ->name('forgot-password');
        Route::post('reset-password', [CustomerAuthController::class, 'resetPassword'])
            ->middleware('throttle:5,1')
            ->name('reset-password');

        Route::middleware('auth:customer_api')->group(function (): void {
            Route::get('me', [CustomerAuthController::class, 'me'])->name('me');
            Route::post('logout', [CustomerAuthController::class, 'logout'])->name('logout');
        });
    });

    Route::middleware('auth:customer_api')->group(function (): void {
        Route::get('checkout/summary', [CheckoutController::class, 'summary'])->name('checkout.summary');
        Route::post('checkout', [CheckoutController::class, 'store'])->name('checkout.store');
        Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
        Route::get('orders/{orderNumber}', [OrderController::class, 'show'])->name('orders.show');
        Route::post('orders/{orderNumber}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
    });
});
