<?php

namespace App\OpenApi\Paths;

use OpenApi\Attributes as OA;

#[OA\Get(
    path: '/api/v1/home',
    description: 'Endpoint publik untuk data homepage frontend, termasuk section yang akan diisi banner, kategori, koleksi, produk, dan FAQ.',
    summary: 'Get home data',
    tags: ['General / Master Data'],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Home data endpoint response.',
            content: new OA\JsonContent(ref: '#/components/schemas/HomeResponse'),
        ),
    ],
)]
#[OA\Get(
    path: '/api/v1/products',
    description: 'Endpoint publik untuk daftar produk ecommerce dengan dukungan filter pencarian, kategori, brand, koleksi, range harga customer/frontend, status stok, dan sorting katalog.',
    summary: 'List products',
    tags: ['Products'],
    parameters: [
        new OA\Parameter(
            name: 'search',
            description: 'Cari berdasarkan nama produk, slug, SKU, deskripsi, nama brand, nama kategori, atau SKU/nama variant item.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'iphone'),
        ),
        new OA\Parameter(
            name: 'category',
            description: 'Slug atau UUID kategori produk.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'phones'),
        ),
        new OA\Parameter(
            name: 'brand',
            description: 'Slug atau UUID brand produk.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'apple'),
        ),
        new OA\Parameter(
            name: 'collection',
            description: 'Slug atau UUID product collection aktif.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'featured-phones'),
        ),
        new OA\Parameter(
            name: 'min_price',
            description: 'Filter harga jual minimum untuk frontend/customer.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'number', format: 'float', example: 100000),
        ),
        new OA\Parameter(
            name: 'max_price',
            description: 'Filter harga jual maksimum untuk frontend/customer.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'number', format: 'float', example: 500000),
        ),
        new OA\Parameter(
            name: 'has_stock',
            description: 'Jika true, hanya tampilkan produk dengan stok tersedia.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'boolean', example: true),
        ),
        new OA\Parameter(
            name: 'sort',
            description: 'Sorting katalog publik.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', enum: ['latest', 'oldest', 'name', 'name_asc', 'name_desc', 'price_low', 'price_high', 'price_asc', 'price_desc'], example: 'price_asc'),
        ),
        new OA\Parameter(
            name: 'per_page',
            description: 'Jumlah item per halaman.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'integer', example: 12),
        ),
        new OA\Parameter(
            name: 'page',
            description: 'Nomor halaman pagination.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'integer', example: 1),
        ),
    ],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Products endpoint response.',
            content: new OA\JsonContent(
                ref: '#/components/schemas/PlaceholderCollectionResponse',
                example: [
                    'success' => true,
                    'message' => 'Products endpoint is ready',
                    'data' => ['items' => [], 'meta' => ['status' => 'placeholder']],
                ],
            ),
        ),
    ],
)]
#[OA\Get(
    path: '/api/v1/products/{slug}',
    description: 'Endpoint publik untuk detail produk berdasarkan slug. Response saat ini mengikuti kontrak placeholder yang tersedia di controller.',
    summary: 'Get product detail',
    tags: ['Products'],
    parameters: [
        new OA\Parameter(
            name: 'slug',
            description: 'Product slug.',
            in: 'path',
            required: true,
            schema: new OA\Schema(type: 'string', example: 'iphone-15-pro'),
        ),
    ],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Product detail endpoint response.',
            content: new OA\JsonContent(ref: '#/components/schemas/PlaceholderDetailResponse'),
        ),
    ],
)]
#[OA\Get(
    path: '/api/v1/categories',
    description: 'Endpoint publik untuk daftar kategori produk ecommerce. Response saat ini mengikuti kontrak placeholder yang tersedia di controller.',
    summary: 'List product categories',
    tags: ['Products'],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Categories endpoint response.',
            content: new OA\JsonContent(
                ref: '#/components/schemas/PlaceholderCollectionResponse',
                example: [
                    'success' => true,
                    'message' => 'Categories endpoint is ready',
                    'data' => ['items' => [], 'meta' => ['status' => 'placeholder']],
                ],
            ),
        ),
    ],
)]
#[OA\Get(
    path: '/api/v1/brands',
    description: 'Endpoint publik untuk daftar brand ecommerce. Response saat ini mengikuti kontrak placeholder yang tersedia di controller.',
    summary: 'List brands',
    tags: ['Products'],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Brands endpoint response.',
            content: new OA\JsonContent(
                ref: '#/components/schemas/PlaceholderCollectionResponse',
                example: [
                    'success' => true,
                    'message' => 'Brands endpoint is ready',
                    'data' => ['items' => [], 'meta' => ['status' => 'placeholder']],
                ],
            ),
        ),
    ],
)]
#[OA\Get(
    path: '/api/v1/product-collections',
    description: 'Endpoint publik untuk daftar koleksi produk ecommerce. Response saat ini mengikuti kontrak placeholder yang tersedia di controller.',
    summary: 'List product collections',
    tags: ['Products'],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Product collections endpoint response.',
            content: new OA\JsonContent(
                ref: '#/components/schemas/PlaceholderCollectionResponse',
                example: [
                    'success' => true,
                    'message' => 'Product collections endpoint is ready',
                    'data' => ['items' => [], 'meta' => ['status' => 'placeholder']],
                ],
            ),
        ),
    ],
)]
#[OA\Get(
    path: '/api/v1/cart',
    description: 'Mengambil cart aktif. Guest cart dibaca dari header X-Cart-Token. Jika bearer token customer valid dikirim, cart customer akan diprioritaskan.',
    summary: 'Get current cart',
    security: [['bearerAuth' => []]],
    tags: ['Cart'],
    parameters: [
        new OA\Parameter(
            name: 'X-Cart-Token',
            description: 'Token cart guest dari frontend Next.js. Wajib untuk guest cart, opsional untuk customer login.',
            in: 'header',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'guest-cart-token-from-nextjs'),
        ),
    ],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Cart retrieved successfully.',
            content: new OA\JsonContent(ref: '#/components/schemas/CartResponse'),
        ),
    ],
)]
#[OA\Post(
    path: '/api/v1/cart/items',
    description: 'Menambahkan produk ke cart. Produk dengan has_variant=true wajib mengirim variant_item_id. Jika X-Cart-Token tidak dikirim dan customer belum login, API akan membuat cart token baru dan mengembalikannya di response header X-Cart-Token dan payload data.cart_token.',
    summary: 'Add cart item',
    security: [['bearerAuth' => []]],
    requestBody: new OA\RequestBody(
        required: true,
        content: new OA\JsonContent(ref: '#/components/schemas/AddCartItemRequest'),
    ),
    tags: ['Cart'],
    parameters: [
        new OA\Parameter(
            name: 'X-Cart-Token',
            description: 'Token cart guest dari frontend Next.js.',
            in: 'header',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'guest-cart-token-from-nextjs'),
        ),
    ],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Cart item added successfully.',
            headers: [
                new OA\Header(
                    header: 'X-Cart-Token',
                    description: 'Cart token yang harus disimpan frontend untuk guest cart.',
                    schema: new OA\Schema(type: 'string'),
                ),
            ],
            content: new OA\JsonContent(ref: '#/components/schemas/CartResponse'),
        ),
        new OA\Response(
            response: 422,
            description: 'Validation error, product unavailable, variant required, or insufficient stock.',
            content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse'),
        ),
    ],
)]
#[OA\Put(
    path: '/api/v1/cart/items/{item}',
    description: 'Mengubah quantity item cart. Header X-Cart-Token digunakan untuk guest cart, sedangkan bearer token digunakan untuk customer cart.',
    summary: 'Update cart item quantity',
    security: [['bearerAuth' => []]],
    requestBody: new OA\RequestBody(
        required: true,
        content: new OA\JsonContent(ref: '#/components/schemas/UpdateCartItemRequest'),
    ),
    tags: ['Cart'],
    parameters: [
        new OA\Parameter(
            name: 'item',
            description: 'Cart item UUID.',
            in: 'path',
            required: true,
            schema: new OA\Schema(type: 'string', format: 'uuid', example: '9d44f95d-982b-4216-9b17-51cf9e34fa46'),
        ),
        new OA\Parameter(
            name: 'X-Cart-Token',
            description: 'Token cart guest dari frontend Next.js.',
            in: 'header',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'guest-cart-token-from-nextjs'),
        ),
    ],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Cart item updated successfully.',
            content: new OA\JsonContent(ref: '#/components/schemas/CartResponse'),
        ),
        new OA\Response(
            response: 404,
            description: 'Cart not found.',
            content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse'),
        ),
        new OA\Response(
            response: 422,
            description: 'Validation error, cart item not found, or insufficient stock.',
            content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse'),
        ),
    ],
)]
#[OA\Patch(
    path: '/api/v1/cart/items/{item}',
    description: 'Alias PATCH untuk update quantity item cart. Kontrak request dan response sama seperti PUT.',
    summary: 'Patch cart item quantity',
    security: [['bearerAuth' => []]],
    requestBody: new OA\RequestBody(
        required: true,
        content: new OA\JsonContent(ref: '#/components/schemas/UpdateCartItemRequest'),
    ),
    tags: ['Cart'],
    parameters: [
        new OA\Parameter(
            name: 'item',
            description: 'Cart item UUID.',
            in: 'path',
            required: true,
            schema: new OA\Schema(type: 'string', format: 'uuid', example: '9d44f95d-982b-4216-9b17-51cf9e34fa46'),
        ),
        new OA\Parameter(
            name: 'X-Cart-Token',
            description: 'Token cart guest dari frontend Next.js.',
            in: 'header',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'guest-cart-token-from-nextjs'),
        ),
    ],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Cart item updated successfully.',
            content: new OA\JsonContent(ref: '#/components/schemas/CartResponse'),
        ),
        new OA\Response(
            response: 404,
            description: 'Cart not found.',
            content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse'),
        ),
        new OA\Response(
            response: 422,
            description: 'Validation error, cart item not found, or insufficient stock.',
            content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse'),
        ),
    ],
)]
#[OA\Delete(
    path: '/api/v1/cart/items/{item}',
    description: 'Menghapus satu item dari cart. Jika item terakhir dihapus, cart ikut dihapus dan response mengembalikan cart kosong.',
    summary: 'Remove cart item',
    security: [['bearerAuth' => []]],
    tags: ['Cart'],
    parameters: [
        new OA\Parameter(
            name: 'item',
            description: 'Cart item UUID.',
            in: 'path',
            required: true,
            schema: new OA\Schema(type: 'string', format: 'uuid', example: '9d44f95d-982b-4216-9b17-51cf9e34fa46'),
        ),
        new OA\Parameter(
            name: 'X-Cart-Token',
            description: 'Token cart guest dari frontend Next.js.',
            in: 'header',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'guest-cart-token-from-nextjs'),
        ),
    ],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Cart item removed successfully.',
            content: new OA\JsonContent(ref: '#/components/schemas/CartResponse'),
        ),
        new OA\Response(
            response: 404,
            description: 'Cart not found.',
            content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse'),
        ),
        new OA\Response(
            response: 422,
            description: 'Cart item not found.',
            content: new OA\JsonContent(ref: '#/components/schemas/ApiErrorResponse'),
        ),
    ],
)]
#[OA\Delete(
    path: '/api/v1/cart',
    description: 'Mengosongkan cart aktif. Guest cart ditentukan oleh X-Cart-Token, customer cart ditentukan oleh bearer token.',
    summary: 'Clear current cart',
    security: [['bearerAuth' => []]],
    tags: ['Cart'],
    parameters: [
        new OA\Parameter(
            name: 'X-Cart-Token',
            description: 'Token cart guest dari frontend Next.js.',
            in: 'header',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'guest-cart-token-from-nextjs'),
        ),
    ],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Cart cleared successfully.',
            content: new OA\JsonContent(ref: '#/components/schemas/CartResponse'),
        ),
    ],
)]
#[OA\Get(
    path: '/api/v1/banner-slides',
    description: 'Endpoint publik untuk daftar banner slide aktif sesuai jadwal start_at/end_at. Banner tidak memiliki field slug dan tidak memiliki tabel translation, sehingga API detail /{slug} tidak dibuat.',
    summary: 'List banner slides',
    tags: ['General / Master Data'],
    parameters: [
        new OA\Parameter(
            name: 'type',
            description: 'Tipe halaman/banner. Alias query page juga didukung.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'homepage'),
        ),
        new OA\Parameter(
            name: 'position',
            description: 'Posisi banner pada halaman.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'main'),
        ),
        new OA\Parameter(
            name: 'page',
            description: 'Alias untuk type, misalnya page=homepage.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'homepage'),
        ),
        new OA\Parameter(
            name: 'placement',
            description: 'Alias gabungan type_position, misalnya homepage_main atau homepage_hero.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'homepage_main'),
        ),
        new OA\Parameter(
            name: 'lang',
            description: 'Diterima untuk kompatibilitas frontend, tetapi banner slide belum memiliki tabel translation sehingga field utama dari banner_slides digunakan.',
            in: 'query',
            required: false,
            schema: new OA\Schema(type: 'string', example: 'id'),
        ),
    ],
    responses: [
        new OA\Response(
            response: 200,
            description: 'Banner slides retrieved successfully.',
            content: new OA\JsonContent(ref: '#/components/schemas/BannerSlideListResponse'),
        ),
        new OA\Response(
            response: 422,
            description: 'Validation error.',
            content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse'),
        ),
    ],
)]
#[OA\Get(
    path: '/api/v1/faqs',
    description: 'Endpoint publik untuk daftar FAQ aktif. Response saat ini mengikuti kontrak placeholder yang tersedia di controller.',
    summary: 'List FAQs',
    tags: ['General / Master Data'],
    responses: [
        new OA\Response(
            response: 200,
            description: 'FAQs endpoint response.',
            content: new OA\JsonContent(
                ref: '#/components/schemas/PlaceholderCollectionResponse',
                example: [
                    'success' => true,
                    'message' => 'FAQs endpoint is ready',
                    'data' => ['items' => [], 'meta' => ['status' => 'placeholder']],
                ],
            ),
        ),
    ],
)]
final class PublicEcommercePaths {}
