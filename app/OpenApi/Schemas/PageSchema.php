<?php

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'PageListItem',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'title', type: 'string', example: 'About Us'),
        new OA\Property(property: 'slug', type: 'string', example: 'about-us'),
        new OA\Property(property: 'excerpt', type: 'string', nullable: true, example: 'Tentang Gita Trading Store'),
        new OA\Property(property: 'featured_image', type: 'string', nullable: true, example: 'https://img.gitatrading-store.com/media/2026/06/about.webp'),
        new OA\Property(property: 'published_at', type: 'string', format: 'date-time', nullable: true, example: '2026-06-07T00:00:00.000000Z'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'PageDetail',
    allOf: [
        new OA\Schema(ref: '#/components/schemas/PageListItem'),
        new OA\Schema(
            properties: [
                new OA\Property(property: 'content', type: 'string', nullable: true, example: '[{"type":"paragraph","data":{"text":"About us"}}]'),
                new OA\Property(property: 'status', type: 'string', example: 'publish'),
                new OA\Property(
                    property: 'blocks',
                    type: 'array',
                    items: new OA\Items(ref: '#/components/schemas/Block'),
                ),
                new OA\Property(
                    property: 'seo',
                    properties: [
                        new OA\Property(property: 'title', type: 'string', nullable: true, example: 'About Gita Trading Store'),
                        new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Supplier gadget terpercaya'),
                        new OA\Property(property: 'keywords', type: 'string', nullable: true, example: 'gadget, trading, store'),
                    ],
                    type: 'object',
                ),
                new OA\Property(property: 'og_image', type: 'string', nullable: true, example: 'https://img.gitatrading-store.com/media/2026/06/about-og.webp'),
                new OA\Property(
                    property: 'language',
                    properties: [
                        new OA\Property(property: 'id', type: 'integer', example: 1),
                        new OA\Property(property: 'code', type: 'string', example: 'id'),
                        new OA\Property(property: 'name', type: 'string', nullable: true, example: 'Indonesian'),
                    ],
                    type: 'object',
                    nullable: true,
                ),
                new OA\Property(
                    property: 'translations',
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: 'language_id', type: 'integer', example: 1),
                            new OA\Property(property: 'title', type: 'string', example: 'Tentang Kami'),
                            new OA\Property(property: 'slug', type: 'string', example: 'tentang-kami'),
                            new OA\Property(property: 'excerpt', type: 'string', nullable: true),
                            new OA\Property(property: 'published_at', type: 'string', format: 'date-time', nullable: true),
                        ],
                        type: 'object',
                    ),
                ),
            ],
            type: 'object',
        ),
    ],
)]
final class PageSchema {}
