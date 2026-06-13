<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\DynamicContentIndexRequest;
use App\Http\Resources\Api\V1\DynamicContentEntryResource;
use App\Http\Resources\Api\V1\DynamicContentTypeResource;
use App\Services\Api\V1\DynamicContentApiService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class DynamicContentController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly DynamicContentApiService $dynamicContentApiService
    ) {}

    #[OA\Get(
        path: '/api/v1/content-types',
        description: 'Returns all active dynamic content types and their active field definitions.',
        summary: 'Get active dynamic content types',
        tags: ['Dynamic Content'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Dynamic content types retrieved successfully.',
            ),
        ],
    )]
    public function contentTypes(): JsonResponse
    {
        $contentTypes = $this->dynamicContentApiService->listActiveContentTypes();

        return $this->successResponse(
            DynamicContentTypeResource::collection($contentTypes)->resolve(),
            'Content types retrieved successfully',
        );
    }

    #[OA\Get(
        path: '/api/v1/content/{content_type_slug}',
        description: 'Returns a paginated list of published dynamic content entries for the given content type slug.',
        summary: 'Get dynamic content list by type',
        tags: ['Dynamic Content'],
        parameters: [
            new OA\Parameter(name: 'content_type_slug', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string', nullable: true)),
            new OA\Parameter(name: 'is_featured', in: 'query', required: false, schema: new OA\Schema(type: 'boolean', nullable: true)),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10, minimum: 1, maximum: 100)),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1, minimum: 1)),
            new OA\Parameter(name: 'sort', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['title', 'published_at', 'sort_order', 'created_at'])),
            new OA\Parameter(name: 'order', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'])),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Dynamic content entries retrieved successfully.',
            ),
            new OA\Response(
                response: 404,
                description: 'Content type not found.',
            ),
        ],
    )]
    public function index(DynamicContentIndexRequest $request, string $contentTypeSlug): JsonResponse
    {
        $contentType = $this->dynamicContentApiService->findActiveContentType($contentTypeSlug);

        if (! $contentType) {
            return $this->errorResponse('Content type not found', 404);
        }

        $entries = $this->dynamicContentApiService->paginatePublishedEntries(
            $contentType,
            $request->validated(),
        );

        return $this->successResponseWithMeta(
            DynamicContentEntryResource::collection($entries->getCollection())->resolve($request),
            [
                'current_page' => $entries->currentPage(),
                'per_page' => $entries->perPage(),
                'total' => $entries->total(),
                'last_page' => $entries->lastPage(),
            ],
            'Content entries retrieved successfully',
        );
    }

    #[OA\Get(
        path: '/api/v1/content/{content_type_slug}/{entry_slug}',
        description: 'Returns one published dynamic content entry by content type slug and entry slug.',
        summary: 'Get dynamic content detail by slug',
        tags: ['Dynamic Content'],
        parameters: [
            new OA\Parameter(name: 'content_type_slug', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'entry_slug', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Dynamic content entry retrieved successfully.',
            ),
            new OA\Response(
                response: 404,
                description: 'Content type or entry not found.',
            ),
        ],
    )]
    public function show(string $contentTypeSlug, string $entrySlug): JsonResponse
    {
        $contentType = $this->dynamicContentApiService->findActiveContentType($contentTypeSlug);

        if (! $contentType) {
            return $this->errorResponse('Content type not found', 404);
        }

        $entry = $this->dynamicContentApiService->findPublishedEntry($contentType, $entrySlug);

        if (! $entry) {
            return $this->errorResponse('Content entry not found', 404);
        }

        return $this->successResponse(
            DynamicContentEntryResource::make($entry)->resolve(),
            'Content entry retrieved successfully',
        );
    }
}
