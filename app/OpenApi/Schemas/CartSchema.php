<?php

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'CartProduct',
    required: ['id', 'name', 'slug', 'is_publish'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '9c5f48a7-4a56-4f71-a4a5-7a872ecfd413'),
        new OA\Property(property: 'name', type: 'string', example: 'iPhone 15 Pro'),
        new OA\Property(property: 'slug', type: 'string', example: 'iphone-15-pro'),
        new OA\Property(property: 'sku', type: 'string', nullable: true, example: 'IP15P'),
        new OA\Property(property: 'thumbnail', type: 'string', nullable: true, example: 'https://img.gitatrading-store.com/media/2026/06/iphone-15-pro.webp'),
        new OA\Property(property: 'is_publish', type: 'boolean', example: true),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'CartVariantItem',
    required: ['id', 'sku', 'name', 'selling_price', 'is_active'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '9d44f624-73dc-42ce-8510-76ed6c7f1d41'),
        new OA\Property(property: 'sku', type: 'string', example: 'IP15P-BLK-128'),
        new OA\Property(property: 'name', type: 'string', example: 'Black / 128GB'),
        new OA\Property(property: 'image', type: 'string', nullable: true, example: 'https://img.gitatrading-store.com/media/2026/06/iphone-15-pro-black.webp'),
        new OA\Property(property: 'selling_price', type: 'number', format: 'float', example: 17999000),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'CartItem',
    required: ['id', 'product_id', 'qty', 'price', 'subtotal', 'stock_available', 'product'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '9d44f95d-982b-4216-9b17-51cf9e34fa46'),
        new OA\Property(property: 'product_id', type: 'string', format: 'uuid', example: '9c5f48a7-4a56-4f71-a4a5-7a872ecfd413'),
        new OA\Property(property: 'variant_item_id', type: 'string', format: 'uuid', nullable: true, example: '9d44f624-73dc-42ce-8510-76ed6c7f1d41'),
        new OA\Property(property: 'qty', type: 'integer', example: 2),
        new OA\Property(property: 'price', type: 'number', format: 'float', example: 17999000),
        new OA\Property(property: 'subtotal', type: 'number', format: 'float', example: 35998000),
        new OA\Property(property: 'stock_available', type: 'integer', example: 5),
        new OA\Property(property: 'product', ref: '#/components/schemas/CartProduct'),
        new OA\Property(property: 'variant_item', ref: '#/components/schemas/CartVariantItem', nullable: true),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'Cart',
    required: ['id', 'cart_token', 'customer_id', 'is_guest', 'total_qty', 'total_price', 'items'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', nullable: true, example: '9d44f8ea-71d9-4c88-939a-2aafec67dc40'),
        new OA\Property(property: 'cart_token', type: 'string', nullable: true, example: 'guest-cart-token-from-nextjs'),
        new OA\Property(property: 'customer_id', type: 'string', format: 'uuid', nullable: true, example: null),
        new OA\Property(property: 'is_guest', type: 'boolean', example: true),
        new OA\Property(property: 'total_qty', type: 'integer', example: 2),
        new OA\Property(property: 'total_price', type: 'number', format: 'float', example: 35998000),
        new OA\Property(
            property: 'items',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/CartItem'),
        ),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', nullable: true, example: '2026-06-03T10:20:30.000000Z'),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'AddCartItemRequest',
    required: ['product_id'],
    properties: [
        new OA\Property(property: 'product_id', type: 'string', format: 'uuid', example: '9c5f48a7-4a56-4f71-a4a5-7a872ecfd413'),
        new OA\Property(property: 'variant_item_id', type: 'string', format: 'uuid', nullable: true, example: '9d44f624-73dc-42ce-8510-76ed6c7f1d41'),
        new OA\Property(property: 'qty', type: 'integer', minimum: 1, maximum: 999, default: 1, example: 1),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'UpdateCartItemRequest',
    required: ['qty'],
    properties: [
        new OA\Property(property: 'qty', type: 'integer', minimum: 1, maximum: 999, example: 2),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'CartResponse',
    required: ['success', 'message', 'data'],
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Cart retrieved successfully'),
        new OA\Property(property: 'data', ref: '#/components/schemas/Cart'),
    ],
    type: 'object',
)]
final class CartSchema {}
