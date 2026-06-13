<?php

namespace App\OpenApi\Paths;

use OpenApi\Attributes as OA;

#[OA\Get(
    path: '/api/v1/menus/{slug}',
    description: 'Endpoint publik untuk mengambil data menu navigasi berdasarkan slug dan kode bahasa aktif. Menghasilkan menu tree terstruktur (nested). Jika item bertipe `dynamic_products`, response akan memuat array `items` berisi daftar produk relevan dan objek `category` berisi kategori yang dipilih.',
    summary: 'Get nested menu tree by slug',
    tags: ['General / Master Data'],
    parameters: [
        new OA\Parameter(
            name: 'slug',
            description: 'Slug menu (misal: main-menu, footer-menu).',
            in: 'path',
            required: true,
            schema: new OA\Schema(type: 'string', example: 'main-menu'),
        ),
        new OA\Parameter(
            name: 'locale',
            description: 'Kode bahasa aktif (misal: id, en). Jika kosong, menggunakan bahasa default.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'id'),
        ),
    ],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Menu tree retrieved successfully.',
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'message', type: 'string', example: 'Menu retrieved successfully'),
                    new OA\Property(
                        property: 'data',
                        type: 'object',
                        properties: [
                            new OA\Property(property: 'name', type: 'string', example: 'Main Menu'),
                            new OA\Property(property: 'slug', type: 'string', example: 'main-menu'),
                            new OA\Property(
                                property: 'items',
                                type: 'array',
                                items: new OA\Items(
                                    type: 'object',
                                    properties: [
                                        new OA\Property(property: 'id', type: 'integer', example: 10),
                                        new OA\Property(property: 'title', type: 'string', example: 'Produk iPhone'),
                                        new OA\Property(property: 'type', type: 'string', example: 'dynamic_products'),
                                        new OA\Property(property: 'url', type: 'string', nullable: true, example: null),
                                        new OA\Property(property: 'target', type: 'string', example: '_self'),
                                        new OA\Property(property: 'icon', type: 'string', nullable: true, example: 'phone'),
                                        new OA\Property(
                                            property: 'meta',
                                            type: 'object',
                                            properties: [
                                                new OA\Property(property: 'source', type: 'string', example: 'products'),
                                                new OA\Property(
                                                    property: 'filter',
                                                    type: 'object',
                                                    properties: [
                                                        new OA\Property(property: 'category_id', type: 'string', format: 'uuid', example: '95cc02ea-5d12-42ed-a705-73e227b088ef'),
                                                    ]
                                                ),
                                                new OA\Property(property: 'limit', type: 'integer', example: 6),
                                                new OA\Property(property: 'sort', type: 'string', example: 'latest'),
                                                new OA\Property(property: 'layout', type: 'string', example: 'product_grid'),
                                            ]
                                        ),
                                        new OA\Property(
                                            property: 'category',
                                            type: 'object',
                                            nullable: true,
                                            description: 'Informasi kategori produk yang dipilih. Hanya tersedia jika type = dynamic_products.',
                                            properties: [
                                                new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '95cc02ea-5d12-42ed-a705-73e227b088ef'),
                                                new OA\Property(property: 'name', type: 'string', example: 'iPhone'),
                                                new OA\Property(property: 'slug', type: 'string', example: 'iphone'),
                                                new OA\Property(
                                                    property: 'parent',
                                                    type: 'object',
                                                    nullable: true,
                                                    properties: [
                                                        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '85bb02ea-4d12-32ed-a705-63e227b088ef'),
                                                        new OA\Property(property: 'name', type: 'string', example: 'Phone'),
                                                        new OA\Property(property: 'slug', type: 'string', example: 'phone'),
                                                    ]
                                                ),
                                            ]
                                        ),
                                        new OA\Property(
                                            property: 'items',
                                            type: 'array',
                                            items: new OA\Items(
                                                type: 'object',
                                                properties: [
                                                    new OA\Property(property: 'id', type: 'string', example: '019ec173-001f-7323-a43c-e121523ad1de'),
                                                    new OA\Property(property: 'name', type: 'string', example: 'iPhone 16 Pro'),
                                                    new OA\Property(property: 'slug', type: 'string', example: 'iphone-16-pro'),
                                                    new OA\Property(property: 'price', type: 'number', format: 'float', example: 18000000.0),
                                                    new OA\Property(property: 'image', type: 'string', nullable: true, example: 'products/iphone-16.webp'),
                                                    new OA\Property(property: 'url', type: 'string', example: '/products/iphone-16-pro'),
                                                ]
                                            ),
                                            description: 'Resolved dynamic products list.'
                                        ),
                                        new OA\Property(property: 'children', type: 'array', items: new OA\Items(type: 'object'), description: 'Sub-menu items.'),
                                    ]
                                )
                            ),
                        ]
                    ),
                ]
            )
        ),
        new OA\Response(
            response: 404,
            description: 'Menu not found.',
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: false),
                    new OA\Property(property: 'message', type: 'string', example: 'Menu not found'),
                ]
            )
        ),
    ]
)]
final class MenuPaths {}
