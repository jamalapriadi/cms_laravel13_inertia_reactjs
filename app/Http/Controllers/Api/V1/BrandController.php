<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ProductIndexRequest;
use App\Http\Resources\Api\V1\BrandDetailResource;
use App\Http\Resources\Api\V1\EcommerceBrandResource;
use App\Models\Shop\Brand;
use App\Services\Api\V1\ProductCatalogService;
use App\Services\Cache\ListCacheService;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ProductCatalogService $productCatalogService
    ) {}

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

    public function showBySlug(ProductIndexRequest $request, string $slug): JsonResponse
    {
        $filters = $request->validated();

        $payload = app(ListCacheService::class)->rememberRequest("api.brands.show.{$slug}", $request, function () use ($filters, $request, $slug): ?array {
            $brand = Brand::query()
                ->where('is_active', true)
                ->where('slug', $slug)
                ->first();

            if (! $brand) {
                return null;
            }

            $products = $this->productCatalogService->paginateForFilters(
                $filters,
                $request,
                ['brand_id' => $brand->id]
            );

            return [
                ...BrandDetailResource::make($brand)->resolve($request),
                'products' => $products,
            ];
        });

        if (! $payload) {
            return $this->errorResponse('Brand not found', 404);
        }

        return $this->successResponse(
            $payload,
            'Brand retrieved successfully'
        );
    }
}
