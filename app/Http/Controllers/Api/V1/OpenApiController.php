<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class OpenApiController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $generatedOpenApiPath = storage_path('api-docs/api-docs.json');

        if (is_file($generatedOpenApiPath)) {
            return response()->json(json_decode((string) file_get_contents($generatedOpenApiPath), true));
        }

        return response()->json([
            'openapi' => '3.0.3',
            'info' => [
                'title' => 'Gitatrading Store API',
                'version' => 'v1',
                'description' => 'OpenAPI documentation for the Gitatrading Store REST API v1.',
            ],
            'servers' => [
                ['url' => rtrim((string) config('app.url'), '/').'/api/v1'],
                ['url' => 'https://api.gitatrading-store.com/api/v1'],
            ],
            'tags' => [
                [
                    'name' => 'Posts',
                    'description' => 'Published posts and news content for the Next.js frontend.',
                ],
                [
                    'name' => 'Pages',
                    'description' => 'Published static and dynamic pages for the Next.js frontend.',
                ],
                [
                    'name' => 'Regions',
                    'description' => 'Indonesian regional master data (Provinces, Kabupatens, Kecamatans, Kelurahans).',
                ],
            ],
            'paths' => [
                '/pages' => [
                    'get' => [
                        'tags' => ['Pages'],
                        'summary' => 'Get list of published pages',
                        'description' => 'Returns paginated published pages. Supports search, locale/language, pagination, and sort filters.',
                        'parameters' => [
                            $this->queryParameter('search', 'Search pages by title, slug, excerpt, content, or translation content.'),
                            $this->queryParameter('locale', 'Locale or language code.'),
                            $this->queryParameter('language', 'Alias for locale.'),
                            $this->queryParameter('per_page', 'Items per page. Minimum 1, maximum 100.', 'integer', 10),
                            $this->queryParameter('page', 'Page number. Minimum 1.', 'integer', 1),
                            [
                                'name' => 'sort',
                                'in' => 'query',
                                'required' => false,
                                'description' => 'Sort order.',
                                'schema' => [
                                    'type' => 'string',
                                    'enum' => ['latest', 'oldest'],
                                    'default' => 'latest',
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Pages retrieved successfully.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PageListResponse'],
                                        'example' => [
                                            'success' => true,
                                            'message' => 'Pages retrieved successfully',
                                            'data' => [
                                                [
                                                    'id' => 1,
                                                    'title' => 'About Us',
                                                    'slug' => 'about-us',
                                                    'excerpt' => 'Tentang Gita Trading Store',
                                                    'featured_image' => 'https://img.gitatrading-store.com/media/2026/06/about.webp',
                                                    'published_at' => '2026-06-07T00:00:00.000000Z',
                                                ],
                                            ],
                                            'meta' => [
                                                'current_page' => 1,
                                                'per_page' => 10,
                                                'total' => 1,
                                                'last_page' => 1,
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                            '422' => ['$ref' => '#/components/responses/ValidationError'],
                        ],
                    ],
                ],
                '/pages/{slug}' => [
                    'get' => [
                        'tags' => ['Pages'],
                        'summary' => 'Get page detail by slug',
                        'description' => 'Returns a published page detail by base slug or translated slug, including ordered blocks and SEO data.',
                        'parameters' => [
                            [
                                'name' => 'slug',
                                'in' => 'path',
                                'required' => true,
                                'description' => 'Page slug or translated page slug.',
                                'schema' => ['type' => 'string'],
                            ],
                            $this->queryParameter('locale', 'Locale or language code.'),
                            $this->queryParameter('language', 'Alias for locale.'),
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Page retrieved successfully.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PageDetailResponse'],
                                        'example' => [
                                            'success' => true,
                                            'message' => 'Page retrieved successfully',
                                            'data' => [
                                                'id' => 1,
                                                'title' => 'About Us',
                                                'slug' => 'about-us',
                                                'excerpt' => 'Tentang Gita Trading Store',
                                                'content' => '[{"type":"paragraph","data":{"text":"About us"}}]',
                                                'status' => 'publish',
                                                'featured_image' => 'https://img.gitatrading-store.com/media/2026/06/about.webp',
                                                'published_at' => '2026-06-07T00:00:00.000000Z',
                                                'blocks' => [
                                                    [
                                                        'id' => 1,
                                                        'parent_id' => null,
                                                        'type' => 'paragraph',
                                                        'sort_order' => 0,
                                                        'data' => ['text' => 'About us'],
                                                        'styles' => new \stdClass,
                                                        'children' => [],
                                                    ],
                                                ],
                                                'seo' => [
                                                    'title' => 'About Gita Trading Store',
                                                    'description' => 'Supplier gadget terpercaya',
                                                    'keywords' => 'gadget, trading, store',
                                                ],
                                                'og_image' => null,
                                                'language' => [
                                                    'id' => 1,
                                                    'code' => 'id',
                                                    'name' => 'Indonesian',
                                                ],
                                                'translations' => [],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                            '404' => [
                                'description' => 'Page not found.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/ErrorResponse'],
                                        'example' => [
                                            'success' => false,
                                            'message' => 'Page not found',
                                            'errors' => new \stdClass,
                                        ],
                                    ],
                                ],
                            ],
                            '422' => ['$ref' => '#/components/responses/ValidationError'],
                        ],
                    ],
                ],
                '/posts' => [
                    'get' => [
                        'tags' => ['Posts'],
                        'summary' => 'Get list of published posts',
                        'description' => 'Returns paginated published posts. Supports search, category slug, language, pagination, and sort filters.',
                        'parameters' => [
                            $this->queryParameter('search', 'Search posts by title, slug, content, or translation content.'),
                            $this->queryParameter('category', 'Filter posts by category slug. Supports taxonomy categories and dashboard post category metadata.'),
                            $this->queryParameter('language', 'Language code, default locale, or language tag. Defaults to configured primary language.'),
                            $this->queryParameter('per_page', 'Items per page. Minimum 1, maximum 100.', 'integer', 10),
                            $this->queryParameter('page', 'Page number. Minimum 1.', 'integer', 1),
                            [
                                'name' => 'sort',
                                'in' => 'query',
                                'required' => false,
                                'description' => 'Sort order.',
                                'schema' => [
                                    'type' => 'string',
                                    'enum' => ['latest', 'oldest'],
                                    'default' => 'latest',
                                ],
                            ],
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Posts retrieved successfully.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PostListResponse'],
                                        'example' => [
                                            'success' => true,
                                            'message' => 'Posts retrieved successfully',
                                            'data' => [
                                                [
                                                    'id' => 1,
                                                    'title' => 'Judul Post',
                                                    'slug' => 'judul-post',
                                                    'excerpt' => 'Ringkasan post',
                                                    'thumbnail' => 'https://img.gitatrading-store.com/media/2026/06/post-thumbnail.webp',
                                                    'published_at' => '2026-06-02T00:00:00.000000Z',
                                                    'categories' => [
                                                        [
                                                            'id' => 'uuid',
                                                            'name' => 'News',
                                                            'slug' => 'news',
                                                        ],
                                                    ],
                                                ],
                                            ],
                                            'meta' => [
                                                'current_page' => 1,
                                                'per_page' => 10,
                                                'total' => 100,
                                                'last_page' => 10,
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                            '422' => ['$ref' => '#/components/responses/ValidationError'],
                        ],
                    ],
                ],
                '/posts/{slug}' => [
                    'get' => [
                        'tags' => ['Posts'],
                        'summary' => 'Get post detail by slug',
                        'description' => 'Returns a published post detail by base slug or translated slug, including ordered blocks and optional translation data.',
                        'parameters' => [
                            [
                                'name' => 'slug',
                                'in' => 'path',
                                'required' => true,
                                'description' => 'Post slug or translated post slug.',
                                'schema' => ['type' => 'string'],
                            ],
                            $this->queryParameter('language', 'Language code, default locale, or language tag. Defaults to configured primary language.'),
                        ],
                        'responses' => [
                            '200' => [
                                'description' => 'Post retrieved successfully.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/PostDetailResponse'],
                                        'example' => [
                                            'success' => true,
                                            'message' => 'Post retrieved successfully',
                                            'data' => [
                                                'id' => 1,
                                                'title' => 'Judul Post',
                                                'slug' => 'judul-post',
                                                'excerpt' => 'Ringkasan post',
                                                'content' => '[{"type":"paragraph","data":{"text":"Isi block paragraph"}}]',
                                                'thumbnail' => 'https://img.gitatrading-store.com/media/2026/06/post-thumbnail.webp',
                                                'published_at' => '2026-06-02T00:00:00.000000Z',
                                                'categories' => [
                                                    [
                                                        'id' => 'uuid',
                                                        'name' => 'News',
                                                        'slug' => 'news',
                                                    ],
                                                ],
                                                'blocks' => [
                                                    [
                                                        'id' => 1,
                                                        'parent_id' => null,
                                                        'type' => 'paragraph',
                                                        'sort_order' => 1,
                                                        'data' => ['text' => 'Isi block paragraph'],
                                                        'styles' => new \stdClass,
                                                        'children' => [],
                                                    ],
                                                ],
                                                'seo' => [
                                                    'title' => null,
                                                    'description' => null,
                                                ],
                                                'language' => [
                                                    'id' => 1,
                                                    'code' => 'id',
                                                    'name' => 'Indonesian',
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                            '404' => [
                                'description' => 'Post not found.',
                                'content' => [
                                    'application/json' => [
                                        'schema' => ['$ref' => '#/components/schemas/ErrorResponse'],
                                        'example' => [
                                            'success' => false,
                                            'message' => 'Post not found',
                                            'errors' => new \stdClass,
                                        ],
                                    ],
                                ],
                            ],
                            '422' => ['$ref' => '#/components/responses/ValidationError'],
                        ],
                    ],
                ],
                '/provinces' => [
                    'get' => [
                        'tags' => ['Regions'],
                        'summary' => 'Get list of provinces',
                        'parameters' => [
                            $this->queryParameter('search', 'Search by name or id.'),
                            $this->queryParameter('per_page', 'Items per page.', 'integer', 15),
                            $this->queryParameter('page', 'Page number.', 'integer', 1),
                        ],
                        'responses' => [
                            '200' => ['$ref' => '#/components/responses/SuccessResponse'],
                        ],
                    ],
                ],
                '/provinces/{province}/kabupatens' => [
                    'get' => [
                        'tags' => ['Regions'],
                        'summary' => 'Get kabupatens by province',
                        'parameters' => [
                            $this->queryParameter('province', 'Province ID.', 'string', null, 'path'),
                            $this->queryParameter('search', 'Search by name or id.'),
                            $this->queryParameter('per_page', 'Items per page.', 'integer', 15),
                            $this->queryParameter('page', 'Page number.', 'integer', 1),
                        ],
                        'responses' => [
                            '200' => ['$ref' => '#/components/responses/SuccessResponse'],
                        ],
                    ],
                ],
                '/kabupatens' => [
                    'get' => [
                        'tags' => ['Regions'],
                        'summary' => 'Get list of kabupatens',
                        'parameters' => [
                            $this->queryParameter('province_id', 'Filter by province ID.'),
                            $this->queryParameter('search', 'Search by name or id.'),
                            $this->queryParameter('per_page', 'Items per page.', 'integer', 15),
                            $this->queryParameter('page', 'Page number.', 'integer', 1),
                        ],
                        'responses' => [
                            '200' => ['$ref' => '#/components/responses/SuccessResponse'],
                        ],
                    ],
                ],
                '/kabupatens/{kabupaten}/kecamatans' => [
                    'get' => [
                        'tags' => ['Regions'],
                        'summary' => 'Get kecamatans by kabupaten',
                        'parameters' => [
                            $this->queryParameter('kabupaten', 'Kabupaten ID.', 'string', null, 'path'),
                            $this->queryParameter('search', 'Search by name or id.'),
                            $this->queryParameter('per_page', 'Items per page.', 'integer', 15),
                            $this->queryParameter('page', 'Page number.', 'integer', 1),
                        ],
                        'responses' => [
                            '200' => ['$ref' => '#/components/responses/SuccessResponse'],
                        ],
                    ],
                ],
                '/kecamatans' => [
                    'get' => [
                        'tags' => ['Regions'],
                        'summary' => 'Get list of kecamatans',
                        'parameters' => [
                            $this->queryParameter('kabupaten_id', 'Filter by kabupaten ID.'),
                            $this->queryParameter('province_id', 'Filter by province ID.'),
                            $this->queryParameter('search', 'Search by name or id.'),
                            $this->queryParameter('per_page', 'Items per page.', 'integer', 15),
                            $this->queryParameter('page', 'Page number.', 'integer', 1),
                        ],
                        'responses' => [
                            '200' => ['$ref' => '#/components/responses/SuccessResponse'],
                        ],
                    ],
                ],
                '/kecamatans/{kecamatan}/kelurahans' => [
                    'get' => [
                        'tags' => ['Regions'],
                        'summary' => 'Get kelurahans by kecamatan',
                        'parameters' => [
                            $this->queryParameter('kecamatan', 'Kecamatan ID.', 'string', null, 'path'),
                            $this->queryParameter('search', 'Search by name or id.'),
                            $this->queryParameter('per_page', 'Items per page.', 'integer', 15),
                            $this->queryParameter('page', 'Page number.', 'integer', 1),
                        ],
                        'responses' => [
                            '200' => ['$ref' => '#/components/responses/SuccessResponse'],
                        ],
                    ],
                ],
                '/kelurahans' => [
                    'get' => [
                        'tags' => ['Regions'],
                        'summary' => 'Get list of kelurahans',
                        'parameters' => [
                            $this->queryParameter('kecamatan_id', 'Filter by kecamatan ID.'),
                            $this->queryParameter('kabupaten_id', 'Filter by kabupaten ID.'),
                            $this->queryParameter('province_id', 'Filter by province ID.'),
                            $this->queryParameter('search', 'Search by name or id.'),
                            $this->queryParameter('per_page', 'Items per page.', 'integer', 15),
                            $this->queryParameter('page', 'Page number.', 'integer', 1),
                        ],
                        'responses' => [
                            '200' => ['$ref' => '#/components/responses/SuccessResponse'],
                        ],
                    ],
                ],
            ],
            'components' => [
                'responses' => [
                    'ValidationError' => [
                        'description' => 'Validation failed.',
                        'content' => [
                            'application/json' => [
                                'schema' => ['$ref' => '#/components/schemas/ValidationErrorResponse'],
                                'example' => [
                                    'success' => false,
                                    'message' => 'Validation failed',
                                    'errors' => [
                                        'per_page' => ['The per page field must not be greater than 100.'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                'schemas' => [
                    'PageListResponse' => $this->pageListResponseSchema(),
                    'PageDetailResponse' => $this->pageDetailResponseSchema(),
                    'PageListItem' => $this->pageListItemSchema(),
                    'PageDetail' => $this->pageDetailSchema(),
                    'PostListResponse' => $this->postListResponseSchema(),
                    'PostDetailResponse' => $this->postDetailResponseSchema(),
                    'PostListItem' => $this->postListItemSchema(),
                    'PostDetail' => $this->postDetailSchema(),
                    'PostCategory' => $this->categorySchema(),
                    'Block' => $this->blockSchema(),
                    'PaginationMeta' => $this->paginationMetaSchema(),
                    'ErrorResponse' => $this->errorResponseSchema(),
                    'ValidationErrorResponse' => $this->validationErrorResponseSchema(),
                ],
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function queryParameter(string $name, string $description, string $type = 'string', mixed $default = null): array
    {
        return [
            'name' => $name,
            'in' => 'query',
            'required' => false,
            'description' => $description,
            'schema' => array_filter([
                'type' => $type,
                'default' => $default,
            ], fn (mixed $value): bool => $value !== null),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function pageListResponseSchema(): array
    {
        return [
            'type' => 'object',
            'required' => ['success', 'message', 'data', 'meta'],
            'properties' => [
                'success' => ['type' => 'boolean'],
                'message' => ['type' => 'string'],
                'data' => [
                    'type' => 'array',
                    'items' => ['$ref' => '#/components/schemas/PageListItem'],
                ],
                'meta' => ['$ref' => '#/components/schemas/PaginationMeta'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function pageDetailResponseSchema(): array
    {
        return [
            'type' => 'object',
            'required' => ['success', 'message', 'data'],
            'properties' => [
                'success' => ['type' => 'boolean'],
                'message' => ['type' => 'string'],
                'data' => ['$ref' => '#/components/schemas/PageDetail'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function pageListItemSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'id' => ['type' => 'integer'],
                'title' => ['type' => 'string'],
                'slug' => ['type' => 'string'],
                'excerpt' => ['type' => 'string', 'nullable' => true],
                'featured_image' => ['type' => 'string', 'nullable' => true],
                'published_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                'created_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                'updated_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function pageDetailSchema(): array
    {
        return [
            'allOf' => [
                ['$ref' => '#/components/schemas/PageListItem'],
                [
                    'type' => 'object',
                    'properties' => [
                        'content' => ['type' => 'string', 'nullable' => true],
                        'status' => ['type' => 'string'],
                        'blocks' => [
                            'type' => 'array',
                            'items' => ['$ref' => '#/components/schemas/Block'],
                        ],
                        'seo' => [
                            'type' => 'object',
                            'properties' => [
                                'title' => ['type' => 'string', 'nullable' => true],
                                'description' => ['type' => 'string', 'nullable' => true],
                                'keywords' => ['type' => 'string', 'nullable' => true],
                            ],
                        ],
                        'og_image' => ['type' => 'string', 'nullable' => true],
                        'language' => [
                            'type' => 'object',
                            'nullable' => true,
                            'properties' => [
                                'id' => ['type' => 'integer'],
                                'code' => ['type' => 'string'],
                                'name' => ['type' => 'string', 'nullable' => true],
                            ],
                        ],
                        'translations' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'language_id' => ['type' => 'integer'],
                                    'title' => ['type' => 'string'],
                                    'slug' => ['type' => 'string'],
                                    'excerpt' => ['type' => 'string', 'nullable' => true],
                                    'published_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function postListResponseSchema(): array
    {
        return [
            'type' => 'object',
            'required' => ['success', 'message', 'data', 'meta'],
            'properties' => [
                'success' => ['type' => 'boolean'],
                'message' => ['type' => 'string'],
                'data' => [
                    'type' => 'array',
                    'items' => ['$ref' => '#/components/schemas/PostListItem'],
                ],
                'meta' => ['$ref' => '#/components/schemas/PaginationMeta'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function postDetailResponseSchema(): array
    {
        return [
            'type' => 'object',
            'required' => ['success', 'message', 'data'],
            'properties' => [
                'success' => ['type' => 'boolean'],
                'message' => ['type' => 'string'],
                'data' => ['$ref' => '#/components/schemas/PostDetail'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function postListItemSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'id' => ['oneOf' => [['type' => 'integer'], ['type' => 'string']]],
                'title' => ['type' => 'string'],
                'slug' => ['type' => 'string'],
                'excerpt' => ['type' => 'string', 'nullable' => true],
                'thumbnail' => ['type' => 'string', 'nullable' => true],
                'published_at' => ['type' => 'string', 'format' => 'date-time', 'nullable' => true],
                'categories' => [
                    'type' => 'array',
                    'items' => ['$ref' => '#/components/schemas/PostCategory'],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function postDetailSchema(): array
    {
        return [
            'allOf' => [
                ['$ref' => '#/components/schemas/PostListItem'],
                [
                    'type' => 'object',
                    'properties' => [
                        'content' => ['type' => 'string', 'nullable' => true],
                        'blocks' => [
                            'type' => 'array',
                            'items' => ['$ref' => '#/components/schemas/Block'],
                        ],
                        'seo' => [
                            'type' => 'object',
                            'properties' => [
                                'title' => ['type' => 'string', 'nullable' => true],
                                'description' => ['type' => 'string', 'nullable' => true],
                            ],
                        ],
                        'language' => [
                            'type' => 'object',
                            'nullable' => true,
                            'properties' => [
                                'id' => ['type' => 'integer'],
                                'code' => ['type' => 'string'],
                                'name' => ['type' => 'string', 'nullable' => true],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function categorySchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'id' => ['oneOf' => [['type' => 'integer'], ['type' => 'string']]],
                'name' => ['type' => 'string', 'nullable' => true],
                'slug' => ['type' => 'string', 'nullable' => true],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function blockSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'id' => ['oneOf' => [['type' => 'integer'], ['type' => 'string']]],
                'parent_id' => ['oneOf' => [['type' => 'integer'], ['type' => 'string']], 'nullable' => true],
                'type' => ['type' => 'string'],
                'sort_order' => ['type' => 'integer'],
                'data' => ['type' => 'object', 'additionalProperties' => true],
                'styles' => ['type' => 'object', 'additionalProperties' => true],
                'children' => [
                    'type' => 'array',
                    'items' => ['$ref' => '#/components/schemas/Block'],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function paginationMetaSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'current_page' => ['type' => 'integer'],
                'per_page' => ['type' => 'integer'],
                'total' => ['type' => 'integer'],
                'last_page' => ['type' => 'integer'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function errorResponseSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'success' => ['type' => 'boolean'],
                'message' => ['type' => 'string'],
                'errors' => ['type' => 'object'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validationErrorResponseSchema(): array
    {
        return [
            'allOf' => [
                ['$ref' => '#/components/schemas/ErrorResponse'],
                [
                    'type' => 'object',
                    'properties' => [
                        'errors' => [
                            'type' => 'object',
                            'additionalProperties' => [
                                'type' => 'array',
                                'items' => ['type' => 'string'],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }
}
