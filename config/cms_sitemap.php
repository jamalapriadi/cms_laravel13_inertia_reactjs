<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Enable Sitemap
    |--------------------------------------------------------------------------
    |
    | Set this to false to disable the dynamic /sitemap.xml routes completely.
    |
    | Default: true
    |
    */
    'enabled' => env('CMS_SITEMAP_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Use Cache
    |--------------------------------------------------------------------------
    |
    | If enabled, generated XML responses will be cached to avoid hitting
    | the database on every single request.
    |
    | Default: true
    |
    */
    'use_cache' => env('CMS_SITEMAP_USE_CACHE', true),

    /*
    |--------------------------------------------------------------------------
    | Cache TTL (Time To Live)
    |--------------------------------------------------------------------------
    |
    | Cache duration in seconds. Set to `null` to use rememberForever cache,
    | which only invalidates when a relevant model gets modified.
    |
    | Default: null (rememberForever)
    |
    */
    'cache_ttl' => env('CMS_SITEMAP_CACHE_TTL', null),

    /*
    |--------------------------------------------------------------------------
    | Sitemap Index Mode
    |--------------------------------------------------------------------------
    |
    | When set to true, /sitemap.xml returns a sitemap index containing links
    | to individual sitemaps (e.g. /sitemaps/pages.xml, /sitemaps/products.xml).
    | When set to false, a single flat sitemap.xml is returned.
    |
    | Default: true
    |
    */
    'sitemap_index' => env('CMS_SITEMAP_INDEX', true),

    /*
    |--------------------------------------------------------------------------
    | Included Models/Types
    |--------------------------------------------------------------------------
    |
    | Toggle sitemap inclusion for each individual public content type.
    |
    */
    'include' => [
        'pages' => true,
        'posts' => true,
        'products' => true,
        'categories' => true,
        'brands' => true,
        'collections' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Fallback Base URL
    |--------------------------------------------------------------------------
    |
    | Used if App URL or site settings domain cannot be resolved.
    |
    */
    'fallback_base_url' => env('APP_URL', 'http://localhost:8000'),

    /*
    |--------------------------------------------------------------------------
    | Default Change Frequency and Priority
    |--------------------------------------------------------------------------
    |
    | Fallback change frequency and priority settings for sitemap URLs.
    |
    */
    'default_changefreq' => 'weekly',
    'default_priority' => 0.7,
];
