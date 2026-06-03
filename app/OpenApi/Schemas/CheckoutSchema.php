<?php

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'CheckoutSummaryResponse',
    required: ['success', 'message', 'data'],
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Checkout summary retrieved successfully'),
        new OA\Property(
            property: 'data',
            required: ['cart_id', 'items', 'totals', 'shipping_methods', 'selected_shipping_method', 'payment_methods'],
            properties: [
                new OA\Property(property: 'cart_id', type: 'string', format: 'uuid'),
                new OA\Property(
                    property: 'items',
                    type: 'array',
                    items: new OA\Items(
                        required: ['product_id', 'product_name', 'price', 'qty', 'subtotal', 'stock_available'],
                        properties: [
                            new OA\Property(property: 'cart_item_id', type: 'string', format: 'uuid'),
                            new OA\Property(property: 'product_id', type: 'string', format: 'uuid'),
                            new OA\Property(property: 'variant_item_id', type: 'string', format: 'uuid', nullable: true),
                            new OA\Property(property: 'product_name', type: 'string', example: 'iPhone 15 Pro'),
                            new OA\Property(property: 'variant_name', type: 'string', nullable: true, example: 'Black / 128GB'),
                            new OA\Property(property: 'sku', type: 'string', nullable: true, example: 'IP15P-BLK-128'),
                            new OA\Property(property: 'price', type: 'number', format: 'float', example: 17999000),
                            new OA\Property(property: 'qty', type: 'integer', example: 1),
                            new OA\Property(property: 'subtotal', type: 'number', format: 'float', example: 17999000),
                            new OA\Property(property: 'stock_available', type: 'integer', example: 3),
                        ],
                        type: 'object',
                    ),
                ),
                new OA\Property(
                    property: 'totals',
                    required: ['subtotal', 'shipping_cost', 'discount', 'grand_total'],
                    properties: [
                        new OA\Property(property: 'subtotal', type: 'number', format: 'float', example: 17999000),
                        new OA\Property(property: 'shipping_cost', type: 'number', format: 'float', example: 20000),
                        new OA\Property(property: 'discount', type: 'number', format: 'float', example: 0),
                        new OA\Property(property: 'grand_total', type: 'number', format: 'float', example: 18019000),
                    ],
                    type: 'object',
                ),
                new OA\Property(property: 'selected_shipping_method', type: 'string', example: 'jne_regular'),
                new OA\Property(
                    property: 'shipping_methods',
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: 'code', type: 'string', example: 'jne_regular'),
                            new OA\Property(property: 'name', type: 'string', example: 'JNE Regular'),
                            new OA\Property(property: 'cost', type: 'number', format: 'float', example: 20000),
                        ],
                        type: 'object',
                    ),
                ),
                new OA\Property(
                    property: 'payment_methods',
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: 'code', type: 'string', example: 'bank_transfer'),
                            new OA\Property(property: 'name', type: 'string', example: 'Bank Transfer'),
                        ],
                        type: 'object',
                    ),
                ),
            ],
            type: 'object',
        ),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'CheckoutRequest',
    required: ['shipping_address', 'shipping_method', 'payment_method'],
    properties: [
        new OA\Property(property: 'shipping_address', type: 'string', example: 'Jl. Sudirman No. 10, Jakarta'),
        new OA\Property(property: 'shipping_method', type: 'string', enum: ['pickup', 'jne_regular', 'jnt_regular'], example: 'jne_regular'),
        new OA\Property(property: 'payment_method', type: 'string', enum: ['bank_transfer', 'qris', 'cash_on_delivery'], example: 'bank_transfer'),
        new OA\Property(property: 'notes', type: 'string', nullable: true, example: 'Tolong hubungi sebelum dikirim.'),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'OrderItem',
    required: ['id', 'product_id', 'product_name', 'price', 'qty', 'subtotal'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'product_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'variant_item_id', type: 'string', format: 'uuid', nullable: true),
        new OA\Property(property: 'product_name', type: 'string', example: 'iPhone 15 Pro'),
        new OA\Property(property: 'variant_name', type: 'string', nullable: true, example: 'Black / 128GB'),
        new OA\Property(property: 'price', type: 'number', format: 'float', example: 17999000),
        new OA\Property(property: 'qty', type: 'integer', example: 1),
        new OA\Property(property: 'subtotal', type: 'number', format: 'float', example: 17999000),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'OrderPayment',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'payment_method', type: 'string', example: 'bank_transfer'),
        new OA\Property(property: 'transaction_id', type: 'string', nullable: true),
        new OA\Property(property: 'amount', type: 'number', format: 'float', example: 18019000),
        new OA\Property(property: 'status', type: 'string', example: 'pending'),
        new OA\Property(property: 'paid_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'OrderShipping',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'courier', type: 'string', example: 'jne_regular'),
        new OA\Property(property: 'tracking_number', type: 'string', nullable: true),
        new OA\Property(property: 'status', type: 'string', example: 'pending'),
        new OA\Property(property: 'shipping_cost', type: 'number', format: 'float', example: 20000),
        new OA\Property(property: 'shipping_address', type: 'string', nullable: true, example: 'Jl. Sudirman No. 10, Jakarta'),
        new OA\Property(property: 'shipped_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'delivered_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'Order',
    required: ['id', 'order_number', 'customer', 'subtotal', 'shipping_cost', 'discount', 'grand_total', 'payment_status', 'status'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'order_number', type: 'string', example: 'INV-20260603-000123'),
        new OA\Property(property: 'invoice_number', type: 'string', example: 'INV-20260603-000123'),
        new OA\Property(
            property: 'customer',
            properties: [
                new OA\Property(property: 'id', type: 'string', format: 'uuid'),
                new OA\Property(property: 'name', type: 'string', example: 'Jane Customer'),
                new OA\Property(property: 'email', type: 'string', nullable: true, example: 'jane@example.com'),
                new OA\Property(property: 'phone', type: 'string', nullable: true, example: '081234567890'),
            ],
            type: 'object',
        ),
        new OA\Property(property: 'shipping_address', type: 'string', nullable: true),
        new OA\Property(property: 'subtotal', type: 'number', format: 'float', example: 17999000),
        new OA\Property(property: 'shipping_cost', type: 'number', format: 'float', example: 20000),
        new OA\Property(property: 'discount', type: 'number', format: 'float', example: 0),
        new OA\Property(property: 'grand_total', type: 'number', format: 'float', example: 18019000),
        new OA\Property(property: 'payment_status', type: 'string', example: 'pending'),
        new OA\Property(property: 'status', type: 'string', example: 'pending'),
        new OA\Property(property: 'paid_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'items', type: 'array', items: new OA\Items(ref: '#/components/schemas/OrderItem')),
        new OA\Property(property: 'payments', type: 'array', items: new OA\Items(ref: '#/components/schemas/OrderPayment')),
        new OA\Property(property: 'shipping', ref: '#/components/schemas/OrderShipping', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'OrderResponse',
    required: ['success', 'message', 'data'],
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Order retrieved successfully'),
        new OA\Property(property: 'data', ref: '#/components/schemas/Order'),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'OrderListResponse',
    required: ['success', 'message', 'data', 'meta'],
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Orders retrieved successfully'),
        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Order')),
        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
    ],
    type: 'object',
)]
final class CheckoutSchema {}
