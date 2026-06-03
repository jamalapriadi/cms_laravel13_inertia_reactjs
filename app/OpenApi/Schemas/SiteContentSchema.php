<?php

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'SiteContentLanguageMeta',
    required: ['requested', 'current', 'fallback', 'active'],
    properties: [
        new OA\Property(property: 'requested', type: 'string', nullable: true, example: 'id'),
        new OA\Property(property: 'current', type: 'string', example: 'id'),
        new OA\Property(property: 'fallback', type: 'string', example: 'id'),
        new OA\Property(
            property: 'active',
            type: 'array',
            items: new OA\Items(type: 'string'),
            example: ['id', 'en'],
        ),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'SiteContentCacheMeta',
    required: ['ttl_seconds', 'generated_at'],
    properties: [
        new OA\Property(property: 'ttl_seconds', type: 'integer', example: 86400),
        new OA\Property(property: 'generated_at', type: 'string', format: 'date-time', example: '2026-06-03T10:00:00+07:00'),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'SiteContentItem',
    required: ['id', 'key', 'group', 'type', 'value', 'locale', 'fallback_used', 'sort_order'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'key', type: 'string', example: 'homepage.hero.headline'),
        new OA\Property(property: 'group', type: 'string', nullable: true, example: 'homepage'),
        new OA\Property(property: 'type', type: 'string', example: 'text'),
        new OA\Property(property: 'value', type: 'string', nullable: true, example: 'Temukan gadget Jepang terbaik'),
        new OA\Property(property: 'locale', type: 'string', example: 'id'),
        new OA\Property(property: 'fallback_used', type: 'boolean', example: false),
        new OA\Property(property: 'sort_order', type: 'integer', example: 10),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'SiteContentAllResponse',
    required: ['success', 'message', 'data'],
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Site contents retrieved successfully'),
        new OA\Property(
            property: 'data',
            required: ['language', 'group', 'contents', 'items', 'cache'],
            properties: [
                new OA\Property(property: 'language', ref: '#/components/schemas/SiteContentLanguageMeta'),
                new OA\Property(property: 'group', type: 'string', nullable: true, example: null),
                new OA\Property(
                    property: 'contents',
                    description: 'Object dinamis berisi group => key => value.',
                    type: 'object',
                    additionalProperties: new OA\AdditionalProperties(
                        type: 'object',
                        additionalProperties: new OA\AdditionalProperties(type: 'string', nullable: true),
                    ),
                    example: [
                        'homepage' => [
                            'homepage.hero.headline' => 'Temukan gadget Jepang terbaik',
                            'homepage.hero.cta' => 'Belanja sekarang',
                        ],
                    ],
                ),
                new OA\Property(property: 'items', type: 'array', items: new OA\Items(ref: '#/components/schemas/SiteContentItem')),
                new OA\Property(property: 'cache', ref: '#/components/schemas/SiteContentCacheMeta'),
            ],
            type: 'object',
        ),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'SiteContentGroupResponse',
    required: ['success', 'message', 'data'],
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Site content group retrieved successfully'),
        new OA\Property(
            property: 'data',
            required: ['language', 'group', 'contents', 'items', 'cache'],
            properties: [
                new OA\Property(property: 'language', ref: '#/components/schemas/SiteContentLanguageMeta'),
                new OA\Property(property: 'group', type: 'string', example: 'homepage'),
                new OA\Property(
                    property: 'contents',
                    description: 'Object dinamis berisi key => value untuk group yang diminta.',
                    type: 'object',
                    additionalProperties: new OA\AdditionalProperties(type: 'string', nullable: true),
                    example: [
                        'homepage.hero.headline' => 'Temukan gadget Jepang terbaik',
                        'homepage.hero.cta' => 'Belanja sekarang',
                    ],
                ),
                new OA\Property(property: 'items', type: 'array', items: new OA\Items(ref: '#/components/schemas/SiteContentItem')),
                new OA\Property(property: 'cache', ref: '#/components/schemas/SiteContentCacheMeta'),
            ],
            type: 'object',
        ),
    ],
    type: 'object',
)]
final class SiteContentSchema {}
