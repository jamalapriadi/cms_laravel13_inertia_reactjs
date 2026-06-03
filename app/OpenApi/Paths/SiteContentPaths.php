<?php

namespace App\OpenApi\Paths;

use OpenApi\Attributes as OA;

#[OA\Get(
    path: '/api/v1/site-contents',
    description: 'Endpoint publik untuk mengambil semua active site content berdasarkan bahasa aktif. Response dicache 24 jam dan otomatis invalid ketika data site content atau konfigurasi bahasa di dashboard berubah.',
    summary: 'List site contents by language',
    tags: ['Site Contents'],
    parameters: [
        new OA\Parameter(
            name: 'lang',
            description: 'Kode bahasa aktif. Jika kosong atau tidak aktif, API fallback ke default language.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'id'),
        ),
    ],
    responses: [
        new OA\Response(response: 200, description: 'Site contents retrieved.', content: new OA\JsonContent(ref: '#/components/schemas/SiteContentAllResponse')),
        new OA\Response(response: 422, description: 'Validation error.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
    ],
)]
#[OA\Get(
    path: '/api/v1/site-contents/{group}',
    description: 'Endpoint publik untuk mengambil active site content dalam satu group, misalnya homepage, footer, product_detail, checkout, promo, atau general. Response dicache 24 jam dan otomatis invalid ketika data berubah.',
    summary: 'Get site content group by language',
    tags: ['Site Contents'],
    parameters: [
        new OA\Parameter(
            name: 'group',
            description: 'Group site content.',
            in: 'path',
            required: true,
            schema: new OA\Schema(type: 'string', example: 'homepage'),
        ),
        new OA\Parameter(
            name: 'lang',
            description: 'Kode bahasa aktif. Jika kosong atau tidak aktif, API fallback ke default language.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'id'),
        ),
    ],
    responses: [
        new OA\Response(response: 200, description: 'Site content group retrieved.', content: new OA\JsonContent(ref: '#/components/schemas/SiteContentGroupResponse')),
        new OA\Response(response: 422, description: 'Validation error.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
    ],
)]
final class SiteContentPaths {}
