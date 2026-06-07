<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\PageIndexRequest;
use App\Http\Requests\Api\V1\PageShowRequest;
use App\Http\Resources\Api\V1\PageDetailResource;
use App\Http\Resources\Api\V1\PageResource;
use App\Services\Api\V1\PageService;
use App\Services\Cache\ListCacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class PageController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly PageService $pageService
    ) {}

    #[OA\Get(
        path: '/api/v1/pages',
        description: 'Returns a paginated list of published pages for the Next.js frontend.',
        summary: 'Get list of published pages',
        tags: ['Pages'],
        parameters: [
            new OA\Parameter(
                name: 'search',
                description: 'Search by title, slug, excerpt, content, or translation content.',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'string', nullable: true),
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
                description: 'Pages retrieved successfully.',
                content: new OA\JsonContent(
                    required: ['success', 'message', 'data', 'meta'],
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Pages retrieved successfully'),
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/PageListItem'),
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
    public function index(PageIndexRequest $request): JsonResponse
    {
        $payload = app(ListCacheService::class)->rememberRequest('api.pages', $request, function () use ($request): array {
            $pages = $this->pageService->paginatePublished($request->validated());

            return [
                'data' => PageResource::collection($pages->getCollection())->resolve($request),
                'meta' => [
                    'current_page' => $pages->currentPage(),
                    'per_page' => $pages->perPage(),
                    'total' => $pages->total(),
                    'last_page' => $pages->lastPage(),
                ],
            ];
        });

        return $this->successResponseWithMeta(
            $payload['data'],
            $payload['meta'],
            'Pages retrieved successfully'
        );
    }

    #[OA\Get(
        path: '/api/v1/pages/{slug}',
        description: 'Returns a published page detail by base slug or translated slug, including ordered blocks and SEO data.',
        summary: 'Get page detail by slug',
        tags: ['Pages'],
        parameters: [
            new OA\Parameter(
                name: 'slug',
                description: 'Page slug or translated page slug.',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', example: 'about-us'),
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
                description: 'Page retrieved successfully.',
                content: new OA\JsonContent(
                    required: ['success', 'message', 'data'],
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Page retrieved successfully'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/PageDetail'),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 404,
                description: 'Page not found.',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiErrorResponse',
                    example: ['success' => false, 'message' => 'Page not found', 'errors' => []],
                ),
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error.',
                content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse'),
            ),
        ],
    )]
    public function show(PageShowRequest $request, string $slug): JsonResponse
    {
        $validated = $request->validated();
        $page = $this->pageService->findPublishedBySlug(
            $slug,
            $validated['locale'] ?? $validated['language'] ?? null
        );

        if (! $page) {
            return $this->errorResponse('Page not found', 404);
        }

        return $this->successResponse(
            PageDetailResource::make($page)->resolve($request),
            'Page retrieved successfully'
        );
    }
}
