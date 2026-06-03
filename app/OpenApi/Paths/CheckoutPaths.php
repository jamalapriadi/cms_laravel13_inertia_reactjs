<?php

namespace App\OpenApi\Paths;

use OpenApi\Attributes as OA;

#[OA\Get(
    path: '/api/v1/checkout/summary',
    description: 'Mengambil ringkasan checkout dari cart aktif customer login. API menghitung ulang harga dan stok dari database.',
    summary: 'Get checkout summary',
    security: [['bearerAuth' => []]],
    tags: ['Checkout'],
    parameters: [
        new OA\Parameter(
            name: 'shipping_method',
            description: 'Kode metode pengiriman untuk simulasi grand total.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', enum: ['pickup', 'jne_regular', 'jnt_regular'], example: 'jne_regular'),
        ),
    ],
    responses: [
        new OA\Response(response: 200, description: 'Checkout summary retrieved.', content: new OA\JsonContent(ref: '#/components/schemas/CheckoutSummaryResponse')),
        new OA\Response(response: 401, description: 'Unauthenticated.', content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse')),
        new OA\Response(response: 422, description: 'Cart empty, stale product, or insufficient stock.', content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse')),
    ],
)]
#[OA\Post(
    path: '/api/v1/checkout',
    description: 'Membuat order dari cart aktif customer login. Backend validasi ulang cart, menghitung ulang harga, membuat order item snapshot, payment pending, shipping pending, reserve stock unit, dan menandai cart checked_out.',
    summary: 'Submit checkout',
    security: [['bearerAuth' => []]],
    requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/CheckoutRequest')),
    tags: ['Checkout'],
    responses: [
        new OA\Response(response: 201, description: 'Checkout completed.', content: new OA\JsonContent(ref: '#/components/schemas/OrderResponse')),
        new OA\Response(response: 401, description: 'Unauthenticated.', content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse')),
        new OA\Response(response: 422, description: 'Validation error, cart empty, stale product, or insufficient stock.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
    ],
)]
#[OA\Get(
    path: '/api/v1/orders',
    description: 'Mengambil daftar order milik customer login.',
    summary: 'List customer orders',
    security: [['bearerAuth' => []]],
    tags: ['Orders'],
    parameters: [
        new OA\Parameter(
            name: 'per_page',
            description: 'Items per page. Min 1, max 100.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'integer', default: 10, maximum: 100, minimum: 1),
        ),
        new OA\Parameter(
            name: 'page',
            description: 'Page number.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'integer', default: 1, minimum: 1),
        ),
    ],
    responses: [
        new OA\Response(response: 200, description: 'Orders retrieved.', content: new OA\JsonContent(ref: '#/components/schemas/OrderListResponse')),
        new OA\Response(response: 401, description: 'Unauthenticated.', content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse')),
    ],
)]
#[OA\Get(
    path: '/api/v1/orders/{orderNumber}',
    description: 'Mengambil detail order customer login berdasarkan invoice/order number.',
    summary: 'Get customer order detail',
    security: [['bearerAuth' => []]],
    tags: ['Orders'],
    parameters: [
        new OA\Parameter(
            name: 'orderNumber',
            description: 'Invoice/order number.',
            in: 'path',
            required: true,
            schema: new OA\Schema(type: 'string', example: 'INV-20260603-000123'),
        ),
    ],
    responses: [
        new OA\Response(response: 200, description: 'Order retrieved.', content: new OA\JsonContent(ref: '#/components/schemas/OrderResponse')),
        new OA\Response(response: 401, description: 'Unauthenticated.', content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse')),
        new OA\Response(response: 404, description: 'Order not found.', content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse')),
    ],
)]
#[OA\Post(
    path: '/api/v1/orders/{orderNumber}/cancel',
    description: 'Membatalkan order milik customer login jika status order masih pending/processing dan payment_status masih pending. Stock unit reserved akan dilepas kembali ke available.',
    summary: 'Cancel customer order',
    security: [['bearerAuth' => []]],
    tags: ['Orders'],
    parameters: [
        new OA\Parameter(
            name: 'orderNumber',
            description: 'Invoice/order number.',
            in: 'path',
            required: true,
            schema: new OA\Schema(type: 'string', example: 'INV-20260603-000123'),
        ),
    ],
    responses: [
        new OA\Response(response: 200, description: 'Order cancelled.', content: new OA\JsonContent(ref: '#/components/schemas/OrderResponse')),
        new OA\Response(response: 401, description: 'Unauthenticated.', content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse')),
        new OA\Response(response: 422, description: 'Order cannot be cancelled.', content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse')),
    ],
)]
final class CheckoutPaths {}
