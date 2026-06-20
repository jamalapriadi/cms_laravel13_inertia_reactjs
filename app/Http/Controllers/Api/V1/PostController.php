<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\PostIndexRequest;
use App\Http\Requests\Api\V1\PostShowRequest;
use App\Http\Resources\Api\V1\PostDetailResource;
use App\Http\Resources\Api\V1\PostResource;
use App\Services\Api\V1\PostService;
use App\Services\Cache\ListCacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class PostController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly PostService $postService
    ) {}

    #[OA\Get(
        path: '/api/v1/posts',
        description: 'Returns a paginated list of published posts for the Next.js frontend.',
        summary: 'Get list of published posts',
        tags: ['Posts'],
        parameters: [
            new OA\Parameter(
                name: 'search',
                description: 'Search by title, slug, content, or translation content.',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'string', nullable: true),
            ),
            new OA\Parameter(
                name: 'category',
                description: 'Filter by category slug.',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'string', nullable: true, example: 'news'),
            ),
            new OA\Parameter(
                name: 'locale',
                description: 'Locale or language code.',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'string', nullable: true, example: 'id'),
            ),
            new OA\Parameter(
                name: 'language',
                description: 'Alias for locale.',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'string', nullable: true, example: 'id'),
            ),
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
            new OA\Parameter(
                name: 'sort',
                description: 'Sort order.',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'string', default: 'latest', enum: ['latest', 'oldest']),
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Posts retrieved successfully.',
                content: new OA\JsonContent(
                    required: ['success', 'message', 'data', 'meta'],
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Posts retrieved successfully'),
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/PostListItem'),
                        ),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error.',
                content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse'),
            ),
        ],
    )]
    public function index(PostIndexRequest $request): JsonResponse
    {
        $payload = app(ListCacheService::class)->rememberRequest('api.posts', $request, function () use ($request): array {
            $posts = $this->postService->paginatePublished($request->validated());

            return [
                'data' => PostResource::collection($posts->getCollection())->resolve($request),
                'meta' => [
                    'current_page' => $posts->currentPage(),
                    'per_page' => $posts->perPage(),
                    'total' => $posts->total(),
                    'last_page' => $posts->lastPage(),
                ],
            ];
        });

        return $this->successResponseWithMeta(
            $payload['data'],
            $payload['meta'],
            'Posts retrieved successfully'
        );
    }

    #[OA\Get(
        path: '/api/v1/posts/{slug}',
        description: 'Returns a published post detail by slug, including categories, blocks, SEO meta, and language data when available.',
        summary: 'Get post detail by slug',
        tags: ['Posts'],
        parameters: [
            new OA\Parameter(
                name: 'slug',
                description: 'Post slug or translated post slug.',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', example: 'contoh-slug-post'),
            ),
            new OA\Parameter(
                name: 'locale',
                description: 'Locale or language code.',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'string', nullable: true, example: 'id'),
            ),
            new OA\Parameter(
                name: 'language',
                description: 'Alias for locale.',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'string', nullable: true, example: 'id'),
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Post retrieved successfully.',
                content: new OA\JsonContent(
                    required: ['success', 'message', 'data'],
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Post retrieved successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/PostDetail'),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 404,
                description: 'Post not found.',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiErrorResponse',
                    example: ['success' => false, 'message' => 'Post not found', 'errors' => []],
                ),
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error.',
                content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse'),
            ),
        ],
    )]
    public function show(PostShowRequest $request, string $slug): JsonResponse
    {
        $validated = $request->validated();
        $post = $this->postService->findPublishedBySlug(
            $slug,
            $validated['locale'] ?? $validated['language'] ?? null
        );

        if (! $post) {
            return $this->errorResponse('Post not found', 404);
        }

        return $this->successResponse(
            PostDetailResource::make($post)->resolve($request),
            'Post retrieved successfully'
        );
    }
}
