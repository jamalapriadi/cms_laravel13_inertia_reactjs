<?php

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Customer',
    required: ['id', 'name', 'email'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: '9c5f48a7-4a56-4f71-a4a5-7a872ecfd413'),
        new OA\Property(property: 'name', type: 'string', example: 'Jane Customer'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jane@example.com'),
        new OA\Property(property: 'phone', type: 'string', nullable: true, example: '081234567890'),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'CustomerRegisterRequest',
    required: ['name', 'email', 'password', 'password_confirmation'],
    properties: [
        new OA\Property(property: 'name', type: 'string', example: 'Jane Customer'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jane@example.com'),
        new OA\Property(property: 'phone', type: 'string', nullable: true, example: '081234567890'),
        new OA\Property(property: 'password', type: 'string', format: 'password', minLength: 8, example: 'password123'),
        new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'password123'),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'CustomerLoginRequest',
    required: ['email', 'password'],
    properties: [
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jane@example.com'),
        new OA\Property(property: 'password', type: 'string', format: 'password', example: 'password123'),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'CustomerForgotPasswordRequest',
    required: ['email'],
    properties: [
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jane@example.com'),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'CustomerResetPasswordRequest',
    required: ['email', 'token', 'password', 'password_confirmation'],
    properties: [
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jane@example.com'),
        new OA\Property(property: 'token', type: 'string', example: 'reset-token-from-email'),
        new OA\Property(property: 'password', type: 'string', format: 'password', minLength: 8, example: 'newPassword123'),
        new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'newPassword123'),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'CustomerAuthResponse',
    required: ['success', 'message', 'data'],
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Login berhasil.'),
        new OA\Property(
            property: 'data',
            required: ['customer', 'token', 'token_type'],
            properties: [
                new OA\Property(property: 'customer', ref: '#/components/schemas/Customer'),
                new OA\Property(property: 'token', type: 'string', example: 'plain-text-api-token'),
                new OA\Property(property: 'token_type', type: 'string', example: 'Bearer'),
                new OA\Property(property: 'cart', ref: '#/components/schemas/Cart', nullable: true),
            ],
            type: 'object',
        ),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'CustomerMeResponse',
    required: ['success', 'message', 'data'],
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Success'),
        new OA\Property(
            property: 'data',
            required: ['customer'],
            properties: [
                new OA\Property(property: 'customer', ref: '#/components/schemas/Customer'),
            ],
            type: 'object',
        ),
    ],
    type: 'object',
)]
#[OA\Schema(
    schema: 'CustomerMessageResponse',
    required: ['success', 'message', 'data'],
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'message', type: 'string', example: 'Logout berhasil.'),
        new OA\Property(property: 'data', type: 'object', example: []),
    ],
    type: 'object',
)]
final class CustomerAuthSchema {}
