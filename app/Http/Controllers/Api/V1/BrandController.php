<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\EcommerceBrandResource;
use App\Models\Shop\Brand;
use App\Services\Cache\ListCacheService;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $brands = app(ListCacheService::class)->rememberRequest('api.brands', $request, function () use ($request): array {
            $brands = Brand::query()
                ->where('is_active', true)
                ->withCount(['products' => fn (Builder $productQuery) => $productQuery->where('is_publish', true)])
                ->orderBy('name')
                ->get();

            return EcommerceBrandResource::collection($brands)->resolve($request);
        });

        return $this->successResponse(
            $brands,
            'Brands retrieved successfully'
        );
    }
}
