<?php

namespace Jamalapriadi\DynamicContentBuilder\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Jamalapriadi\DynamicContentBuilder\Http\Requests\Api\DynamicContentIndexRequest;
use Jamalapriadi\DynamicContentBuilder\Http\Resources\Api\DynamicContentEntryResource;
use Jamalapriadi\DynamicContentBuilder\Http\Resources\Api\DynamicContentTypeResource;
use Jamalapriadi\DynamicContentBuilder\Services\Api\DynamicContentApiService;

class DynamicContentController extends Controller
{
    public function __construct(
        private readonly DynamicContentApiService $dynamicContentApiService,
    ) {}

    public function contentTypes(): JsonResponse
    {
        $contentTypes = $this->dynamicContentApiService->listActiveContentTypes();

        return response()->json([
            'success' => true,
            'message' => 'Content types retrieved successfully',
            'data' => DynamicContentTypeResource::collection($contentTypes)->resolve(),
        ]);
    }

    public function index(DynamicContentIndexRequest $request, string $contentTypeSlug): JsonResponse
    {
        $contentType = $this->dynamicContentApiService->findActiveContentType($contentTypeSlug);

        if (! $contentType) {
            return response()->json([
                'success' => false,
                'message' => 'Content type not found',
            ], 404);
        }

        $entries = $this->dynamicContentApiService->paginatePublishedEntries(
            $contentType,
            $request->validated(),
            $request->query('locale')
        );

        return response()->json([
            'success' => true,
            'message' => 'Content entries retrieved successfully',
            'data' => DynamicContentEntryResource::collection($entries->getCollection())->resolve($request),
            'meta' => [
                'current_page' => $entries->currentPage(),
                'per_page' => $entries->perPage(),
                'total' => $entries->total(),
                'last_page' => $entries->lastPage(),
            ],
        ]);
    }

    public function show(DynamicContentIndexRequest $request, string $contentTypeSlug, string $entrySlug): JsonResponse
    {
        $contentType = $this->dynamicContentApiService->findActiveContentType($contentTypeSlug);

        if (! $contentType) {
            return response()->json([
                'success' => false,
                'message' => 'Content type not found',
            ], 404);
        }

        $entry = $this->dynamicContentApiService->findPublishedEntry($contentType, $entrySlug, $request->query('locale'));

        if (! $entry) {
            return response()->json([
                'success' => false,
                'message' => 'Content entry not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Content entry retrieved successfully',
            'data' => DynamicContentEntryResource::make($entry)->resolve(),
        ]);
    }
}
