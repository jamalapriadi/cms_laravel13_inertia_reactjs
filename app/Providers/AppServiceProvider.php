<?php

namespace App\Providers;

use App\Models\Shop\CustomerAccessToken;
use App\Models\Shop\ProductStockUnit;
use App\Observers\ListCacheObserver;
use App\Observers\ProductStockUnitObserver;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
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

        $this->configureDefaults();
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
