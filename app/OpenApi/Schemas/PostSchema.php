<?php

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'PostListItem',
    properties: [
        new OA\Property(property: 'id', oneOf: [
            new OA\Schema(type: 'integer'),
            new OA\Schema(type: 'string'),
        ], example: 1),
        new OA\Property(property: 'title', type: 'string', example: 'Judul Post'),
        new OA\Property(property: 'slug', type: 'string', example: 'judul-post'),
        new OA\Property(property: 'excerpt', type: 'string', nullable: true, example: 'Ringkasan post'),
        new OA\Property(property: 'thumbnail', type: 'string', nullable: true, example: 'https://img.gitatrading-store.com/media/2026/06/post-thumbnail.webp'),
        new OA\Property(property: 'published_at', type: 'string', format: 'date-time', nullable: true, example: '2026-06-02T00:00:00.000000Z'),
        new OA\Property(
            property: 'categories',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/Category'),
        ),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'PostDetail',
    allOf: [
        new OA\Schema(ref: '#/components/schemas/PostListItem'),
        new OA\Schema(
            properties: [
                new OA\Property(property: 'content', type: 'string', nullable: true, example: 'Konten post'),
                new OA\Property(
                    property: 'blocks',
                    type: 'array',
                    items: new OA\Items(ref: '#/components/schemas/Block'),
                ),
                new OA\Property(
                    property: 'seo',
                    properties: [
                        new OA\Property(property: 'title', type: 'string', nullable: true, example: 'SEO title'),
                        new OA\Property(property: 'description', type: 'string', nullable: true, example: 'SEO description'),
                    ],
                    type: 'object',
                ),
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
            ],
            type: 'object',
        ),
    ],
)]
final class PostSchema {}
