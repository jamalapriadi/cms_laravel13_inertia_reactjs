<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\OpenApi(
    info: new OA\Info(
        version: '1.0.0',
        description: 'REST API documentation for Gitatrading Store frontend integration with Next.js',
        title: 'Gitatrading Store API Documentation',
    ),
    servers: [
        new OA\Server(url: 'http://localhost:8000', description: 'Local development'),
        new OA\Server(url: 'https://api.gitatrading-store.com', description: 'Production'),
    ],
    tags: [
        new OA\Tag(name: 'Customer Authentication', description: 'API untuk register, login, OTP aktivasi akun, forgot password, reset password, cek user login, dan logout customer.'),
        new OA\Tag(name: 'Products', description: 'API publik untuk produk, kategori produk, brand, dan koleksi produk.'),
        new OA\Tag(name: 'Cart', description: 'API cart frontend Next.js untuk guest cart, customer cart, dan merge cart saat login.'),
        new OA\Tag(name: 'Checkout', description: 'API checkout customer login dari active cart menjadi order.'),
        new OA\Tag(name: 'Orders', description: 'API order customer login untuk list, detail, dan cancel order.'),
        new OA\Tag(name: 'Site Contents', description: 'API publik untuk dynamic frontend copy multi-language dengan cache dan invalidation dari dashboard.'),
        new OA\Tag(name: 'Posts', description: 'Published posts and news content'),
        new OA\Tag(name: 'General / Master Data', description: 'API publik untuk home data, banner, FAQ, dan data umum frontend.'),
        new OA\Tag(name: 'Health', description: 'API information and health checks'),
    ],
    components: new OA\Components(
        securitySchemes: [
            new OA\SecurityScheme(
                securityScheme: 'bearerAuth',
                type: 'http',
                bearerFormat: 'Customer API token',
                scheme: 'bearer',
            ),
        ],
    ),
)]
final class OpenApi {}
