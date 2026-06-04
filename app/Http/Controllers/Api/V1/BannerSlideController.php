<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\BannerSlideRequest;
use App\Http\Resources\Api\V1\BannerSlideResource;
use App\Models\Shop\BannerSlide;
use App\Services\Cache\ListCacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class BannerSlideController extends Controller
{
    use ApiResponse;

    public function index(BannerSlideRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $slides = app(ListCacheService::class)->rememberRequest('api.banner-slides', $request, function () use ($request, $validated): array {
            $slides = BannerSlide::query()
                ->active()
                ->type($validated['type'] ?? null)
                ->position($validated['position'] ?? null)
                ->orderBy('sort_order')
                ->latest()
                ->get();

            return BannerSlideResource::collection($slides)->resolve($request);
        });

        return $this->successResponse(
            $slides,
            'Banner slides retrieved successfully'
        );
    }
}
