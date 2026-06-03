<?php

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Category',
    properties: [
        new OA\Property(property: 'id', oneOf: [
            new OA\Schema(type: 'integer'),
            new OA\Schema(type: 'string'),
        ], example: 'uuid-or-id'),
        new OA\Property(property: 'name', type: 'string', nullable: true, example: 'News'),
        new OA\Property(property: 'slug', type: 'string', nullable: true, example: 'news'),
    ],
    type: 'object',
)]
final class CategorySchema {}
