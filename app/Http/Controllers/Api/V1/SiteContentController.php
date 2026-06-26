<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\SiteContentRequest;
use App\Services\Api\V1\SiteContentApiService;
use App\Services\Cache\ListCacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class SiteContentController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly SiteContentApiService $siteContentService
    ) {}

    public function index(SiteContentRequest $request): JsonResponse
    {
        $data = app(ListCacheService::class)->rememberRequest('api.site-contents', $request, function () use ($request) {
            return $this->siteContentService->getPublicContents($request->validated());
        });

        return $this->successResponse(
            $data,
            'Site contents retrieved successfully.'
        );
    }

    public function show(SiteContentRequest $request, string $key): JsonResponse
    {
        // Try to find by key first using caching
        $data = app(ListCacheService::class)->rememberRequest('api.site-contents', $request, function () use ($request, $key) {
            return $this->siteContentService->getPublicContentByKey($key, $request->validated('locale') ?? $request->validated('lang'));
        }, null, ['key' => $key]);

        if ($data !== null) {
            return $this->successResponse($data, 'Site content retrieved successfully.');
        }

        // Backward compatibility: if not found by key, check if it's a group
        $groupData = app(ListCacheService::class)->rememberRequest('api.site-contents', $request, function () use ($request, $key) {
            return $this->siteContentService->group($key, $request->validated('locale') ?? $request->validated('lang'));
        }, null, ['group' => $key]);

        if (! empty($groupData['items'])) {
            return $this->successResponse($groupData, 'Site content group retrieved successfully.');
        }

        return $this->errorResponse('Site content not found.', 404);
    }

    public function group(SiteContentRequest $request, string $group): JsonResponse
    {
        $data = app(ListCacheService::class)->rememberRequest('api.site-contents', $request, function () use ($request, $group) {
            return $this->siteContentService->group($group, $request->validated('locale') ?? $request->validated('lang'));
        }, null, ['group' => $group]);

        return $this->successResponse(
            $data,
            'Site content group retrieved successfully.'
        );
    }
}
