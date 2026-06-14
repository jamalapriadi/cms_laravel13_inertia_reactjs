<?php

return [
    'paths' => [
        'themes' => base_path('themes'),
        'public' => public_path('vendor/themes'),
        'temp' => storage_path('app/cms/temp/themes'),
    ],

    'public_url_prefix' => 'vendor/themes',

    'fallback_theme_slug' => 'default-admin-login',
    'fallback_slug' => 'default-admin-login',

    'cache' => [
        'active_theme_id' => 'cms.themes.active_theme_id',
    ],

    'fallback_views' => [
        'home' => 'frontend.home',
        'page' => 'frontend.pages.show',
        'product_index' => 'frontend.products.index',
        'product_show' => 'frontend.products.show',
        'category_show' => 'frontend.categories.show',
        '404' => 'frontend.errors.404',
        'fallback' => 'cms.fallback',
    ],

    'dangerous_extensions' => [
        'exe',
        'sh',
        'bat',
        'cmd',
        'phtml',
        'phar',
    ],
];
