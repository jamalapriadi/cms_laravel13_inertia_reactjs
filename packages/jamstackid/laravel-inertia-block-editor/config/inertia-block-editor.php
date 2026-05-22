<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Block Storage
    |--------------------------------------------------------------------------
    */
    'table' => 'content_blocks',

    /*
    |--------------------------------------------------------------------------
    | Optional Controller Routes
    |--------------------------------------------------------------------------
    |
    | The package ships a generic JSON endpoint for saving blocks. Most apps
    | will call BlockTreeService from their own controllers instead.
    */
    'routes' => [
        'enabled' => false,
        'prefix' => 'dashboard/block-editor',
        'name' => 'block-editor.',
        'middleware' => ['web', 'auth'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Blockable Model Map
    |--------------------------------------------------------------------------
    |
    | Used by the optional generic controller. Add aliases for models that may
    | receive blocks, for example: 'post' => App\Models\Post::class.
    */
    'blockables' => [],

    /*
    |--------------------------------------------------------------------------
    | Allowed Block Types
    |--------------------------------------------------------------------------
    */
    'allowed_types' => [
        'section',
        'container',
        'column',
        'columns',
        'flex-row',
        'flex-column',
        'card',
        'tabs',
        'accordion',
        'slider',
        'grid',
        'grid-item',
        'text',
        'paragraph',
        'rich-editor',
        'heading',
        'image',
        'button',
        'icon',
        'divider',
        'spacer',
        'list',
        'quote',
        'code',
    ],
];
