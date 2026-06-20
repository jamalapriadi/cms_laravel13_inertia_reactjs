<?php

namespace Jamalapriadi\DynamicContentBuilder\Http\Controllers\Api;

use App\Services\Cache\ListCacheService;
use Illuminate\Http\Request;
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

    public function contentTypes(Request $request): JsonResponse
    {
        $payload = app(ListCacheService::class)->rememberRequest('api.dynamic-content', $request, function (): array {
            $contentTypes = $this->dynamicContentApiService->listActiveContentTypes();

            return [
                'data' => DynamicContentTypeResource::collection($contentTypes)->resolve(),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Content types retrieved successfully',
            'data' => $payload['data'],
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

        $payload = app(ListCacheService::class)->rememberRequest('api.dynamic-content', $request, function () use ($contentType, $request): array {
            $entries = $this->dynamicContentApiService->paginatePublishedEntries(
                $contentType,
                $request->validated(),
                $request->query('locale')
            );

            return [
                'data' => DynamicContentEntryResource::collection($entries->getCollection())->resolve($request),
                'meta' => [
                    'current_page' => $entries->currentPage(),
                    'per_page' => $entries->perPage(),
                    'total' => $entries->total(),
                    'last_page' => $entries->lastPage(),
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Content entries retrieved successfully',
            'data' => $payload['data'],
            'meta' => $payload['meta'],
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

        $payload = app(ListCacheService::class)->rememberRequest('api.dynamic-content', $request, function () use ($contentType, $entrySlug, $request): ?array {
            $entry = $this->dynamicContentApiService->findPublishedEntry(
                $contentType,
                $entrySlug,
                $request->query('locale')
            );

            if (! $entry) {
                return null;
            }

            return DynamicContentEntryResource::make($entry)->resolve($request);
        });

        if (! $payload) {
            return response()->json([
                'success' => false,
                'message' => 'Content entry not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Content entry retrieved successfully',
            'data' => $payload,
        ]);
    }
}
