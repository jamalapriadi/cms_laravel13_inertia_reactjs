<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\BannerSlideRequest;
use App\Http\Resources\Api\V1\BannerSlideResource;
use App\Models\Shop\BannerSlide;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class BannerSlideController extends Controller
{
    use ApiResponse;

    public function index(BannerSlideRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $slides = BannerSlide::query()
            ->active()
            ->type($validated['type'] ?? null)
            ->position($validated['position'] ?? null)
            ->orderBy('sort_order')
            ->latest()
            ->get();

        return $this->successResponse(
            BannerSlideResource::collection($slides)->resolve($request),
            'Banner slides retrieved successfully'
        );
    }
}
