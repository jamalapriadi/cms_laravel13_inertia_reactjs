<?php

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'BannerSlide',
    required: ['id', 'image_url', 'type', 'position', 'placement', 'is_active', 'sort_order'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'title', type: 'string', nullable: true, example: 'Promo iPhone Jepang'),
        new OA\Property(property: 'subtitle', type: 'string', nullable: true, example: 'Stok ready dan bergaransi'),
        new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Temukan pilihan gadget Jepang terbaik untuk kebutuhanmu.'),
        new OA\Property(property: 'image', type: 'string', nullable: true, example: 'banner_slides/hero.webp'),
        new OA\Property(property: 'image_url', type: 'string', nullable: true, example: 'http://localhost:8000/storage/banner_slides/hero.webp'),
        new OA\Property(property: 'mobile_image', type: 'string', nullable: true, example: 'banner_slides/mobile/hero.webp'),
        new OA\Property(property: 'mobile_image_url', type: 'string', nullable: true, example: 'http://localhost:8000/storage/banner_slides/mobile/hero.webp'),
        new OA\Property(property: 'button_text', type: 'string', nullable: true, example: 'Belanja sekarang'),
        new OA\Property(property: 'button_url', type: 'string', nullable: true, example: '/products'),
        new OA\Property(property: 'type', type: 'string', example: 'homepage'),
        new OA\Property(property: 'position', type: 'string', example: 'main'),
        new OA\Property(property: 'placement', type: 'string', example: 'homepage_main'),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
        new OA\Property(property: 'sort_order', type: 'integer', example: 1),
        new OA\Property(property: 'start_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'end_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'BannerSlideListResponse',
    required: ['success', 'message', 'data'],
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Banner slides retrieved successfully'),
        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/BannerSlide')),
    ],
    type: 'object',
)]
final class BannerSlideSchema {}
