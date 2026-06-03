<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\SiteContentRequest;
use App\Services\Api\V1\SiteContentApiService;
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
        return $this->successResponse(
            $this->siteContentService->all($request->validated('lang')),
            'Site contents retrieved successfully'
        );
    }

    public function group(SiteContentRequest $request, string $group): JsonResponse
    {
        return $this->successResponse(
            $this->siteContentService->group($group, $request->validated('lang')),
            'Site content group retrieved successfully'
        );
    }
}
