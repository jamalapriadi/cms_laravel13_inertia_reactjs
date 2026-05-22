<?php

namespace JamstackId\InertiaBlockEditor;

use Illuminate\Support\ServiceProvider;
use JamstackId\InertiaBlockEditor\Services\BlockTreeService;

class InertiaBlockEditorServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/inertia-block-editor.php', 'inertia-block-editor');

        $this->app->singleton(BlockTreeService::class);
    }

    public function boot(): void
    {
        $this->publishes([
            __DIR__.'/../config/inertia-block-editor.php' => config_path('inertia-block-editor.php'),
        ], 'inertia-block-editor-config');

        $this->publishes([
            __DIR__.'/../database/migrations/create_content_blocks_table.php.stub' => database_path('migrations/'.date('Y_m_d_His').'_create_content_blocks_table.php'),
        ], 'inertia-block-editor-migrations');

        $this->publishes([
            __DIR__.'/../resources/js' => resource_path('js/vendor/inertia-block-editor'),
        ], 'inertia-block-editor-react');

        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
    }
}
