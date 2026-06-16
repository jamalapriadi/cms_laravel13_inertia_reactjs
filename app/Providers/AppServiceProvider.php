<?php

namespace App\Providers;

use App\Models\Brand;
use App\Models\Page;
use App\Models\Post;
use App\Models\Shop\Category;
use App\Models\Shop\CustomerAccessToken;
use App\Models\Shop\Product;
use App\Models\Shop\ProductCollection;
use App\Models\Shop\ProductStockUnit;
use App\Observers\BrandObserver;
use App\Observers\CategoryObserver;
use App\Observers\ListCacheObserver;
use App\Observers\PageObserver;
use App\Observers\PostObserver;
use App\Observers\ProductCollectionObserver;
use App\Observers\ProductObserver;
use App\Observers\ProductStockUnitObserver;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ProductStockUnit::observe(ProductStockUnitObserver::class);
        $this->registerListCacheObservers();
        $this->registerSitemapObservers();

        $this->configureDefaults();

        Gate::before(function ($user, $ability) {
            if (isset($user->is_super_admin) && $user->is_super_admin) {
                return true;
            }
        });
    }

    private function registerSitemapObservers(): void
    {
        $observers = [
            Page::class => PageObserver::class,
            Post::class => PostObserver::class,
            Product::class => ProductObserver::class,
            Category::class => CategoryObserver::class,
            \App\Models\Shop\Brand::class => BrandObserver::class,
            Brand::class => BrandObserver::class,
            ProductCollection::class => ProductCollectionObserver::class,
        ];

        foreach ($observers as $modelClass => $observerClass) {
            if (class_exists($modelClass) && class_exists($observerClass) && is_a($modelClass, Model::class, true)) {
                $modelClass::observe($observerClass);
            }
        }
    }

    private function registerListCacheObservers(): void
    {
        foreach (array_keys(config('list-cache.invalidation', [])) as $modelClass) {
            if (class_exists($modelClass) && is_a($modelClass, Model::class, true)) {
                $modelClass::observe(ListCacheObserver::class);
            }
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        Auth::viaRequest('customer-token', function (Request $request) {
            $plainTextToken = $request->bearerToken();

            if (! $plainTextToken) {
                return null;
            }

            $accessToken = CustomerAccessToken::query()
                ->with('customer')
                ->where('token', hash('sha256', $plainTextToken))
                ->first();

            if (
                ! $accessToken
                || $accessToken->isExpired()
                || ! $accessToken->customer?->is_active
                || $accessToken->customer->email_verified_at === null
            ) {
                return null;
            }

            $accessToken->forceFill(['last_used_at' => now()])->save();
            $request->attributes->set('customer_access_token', $accessToken);

            return $accessToken->customer;
        });

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
