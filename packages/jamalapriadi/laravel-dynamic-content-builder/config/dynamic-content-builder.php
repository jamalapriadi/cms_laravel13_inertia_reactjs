<?php

return [
    'dashboard' => [
        'enabled' => true,
        'prefix' => 'dashboard',
        'middleware' => ['web', 'auth'],
    ],

    'api' => [
        'enabled' => true,
        'prefix' => 'api/v1',
        'middleware' => ['api'],
        'name_prefix' => 'api.v1.',
    ],

    'authorization' => [
        'enabled' => false,
    ],

    'media' => [
        'disk' => 'public',
        'directory' => 'dynamic-content-builder',
        'max_upload_size_kb' => 10240,
        'allowed_extensions' => [
            'jpg',
            'jpeg',
            'png',
            'gif',
            'webp',
            'svg',
            'pdf',
            'doc',
            'docx',
            'xls',
            'xlsx',
            'csv',
            'txt',
            'zip',
        ],
        'metadata_model' => null,
        'metadata_columns' => [
            'path' => 'path',
            'disk' => 'disk',
            'alt' => 'alt',
            'file_name' => 'file_name',
            'mime_type' => 'mime_type',
            'url_accessor' => 'url',
        ],
    ],
];
