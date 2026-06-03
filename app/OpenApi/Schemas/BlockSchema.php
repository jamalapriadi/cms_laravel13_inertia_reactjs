<?php

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Block',
    properties: [
        new OA\Property(property: 'id', oneOf: [
            new OA\Schema(type: 'integer'),
            new OA\Schema(type: 'string'),
        ], example: 1),
        new OA\Property(property: 'parent_id', nullable: true, oneOf: [
            new OA\Schema(type: 'integer'),
            new OA\Schema(type: 'string'),
        ], example: null),
        new OA\Property(property: 'type', type: 'string', example: 'paragraph'),
        new OA\Property(property: 'sort_order', type: 'integer', example: 1),
        new OA\Property(property: 'data', type: 'object', example: ['text' => 'Isi block paragraph']),
        new OA\Property(property: 'styles', type: 'object', example: []),
        new OA\Property(
            property: 'children',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/Block'),
        ),
    ],
    type: 'object',
)]
final class BlockSchema {}
