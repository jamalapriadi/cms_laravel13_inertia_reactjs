<?php

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'PlaceholderCollectionResponse',
    required: ['success', 'message', 'data'],
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Products endpoint is ready'),
        new OA\Property(
            property: 'data',
            required: ['items', 'meta'],
            properties: [
                new OA\Property(
                    property: 'items',
                    type: 'array',
                    items: new OA\Items(type: 'object'),
                    example: [],
                ),
                new OA\Property(
                    property: 'meta',
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'placeholder'),
                    ],
                    type: 'object',
                ),
            ],
            type: 'object',
        ),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'PlaceholderDetailResponse',
    required: ['success', 'message', 'data'],
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Product detail endpoint is ready'),
        new OA\Property(
            property: 'data',
            required: ['item', 'slug', 'meta'],
            properties: [
                new OA\Property(property: 'item', type: 'object', nullable: true, example: null),
                new OA\Property(property: 'slug', type: 'string', example: 'iphone-15-pro'),
                new OA\Property(
                    property: 'meta',
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'placeholder'),
                    ],
                    type: 'object',
                ),
            ],
            type: 'object',
        ),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'HomeResponse',
    required: ['success', 'message', 'data'],
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Home endpoint is ready'),
        new OA\Property(
            property: 'data',
            required: ['sections', 'meta'],
            properties: [
                new OA\Property(
                    property: 'sections',
                    type: 'array',
                    items: new OA\Items(type: 'object'),
                    example: [],
                ),
                new OA\Property(
                    property: 'meta',
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'placeholder'),
                    ],
                    type: 'object',
                ),
            ],
            type: 'object',
        ),
    ],
    type: 'object',
)]
final class PublicEndpointSchema {}
