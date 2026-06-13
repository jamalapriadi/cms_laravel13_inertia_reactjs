<?php

namespace Jamalapriadi\DynamicContentBuilder;

use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;
use Jamalapriadi\DynamicContentBuilder\Console\InstallCommand;
use Jamalapriadi\DynamicContentBuilder\Http\Middleware\AuthorizeDynamicContentBuilder;

class DynamicContentBuilderServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__.'/../config/dynamic-content-builder.php',
            'dynamic-content-builder',
        );
    }

    public function boot(Router $router): void
    {
        $router->aliasMiddleware('dynamic-content-builder.authorize', AuthorizeDynamicContentBuilder::class);

        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        if (config('dynamic-content-builder.dashboard.enabled', true)) {
            $this->loadRoutesFrom(__DIR__.'/../routes/dashboard.php');
        }

        if (config('dynamic-content-builder.api.enabled', true)) {
            $this->loadRoutesFrom(__DIR__.'/../routes/api.php');
        }

        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->publishes([
            __DIR__.'/../config/dynamic-content-builder.php' => config_path('dynamic-content-builder.php'),
        ], 'dynamic-content-builder-config');

        $this->publishes([
            __DIR__.'/../database/migrations' => database_path('migrations'),
        ], 'dynamic-content-builder-migrations');

        $this->publishes([
            __DIR__.'/../resources/stubs/resources/js' => resource_path('js'),
        ], 'dynamic-content-builder-assets');

        $this->commands([
            InstallCommand::class,
        ]);
    }
}
