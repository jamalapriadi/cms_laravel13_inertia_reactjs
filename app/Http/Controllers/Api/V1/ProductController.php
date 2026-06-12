<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ProductIndexRequest;
use App\Http\Resources\Api\V1\ProductDetailResource;
use App\Services\Api\V1\ProductCatalogService;
use App\Services\Cache\ListCacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ProductCatalogService $productCatalogService
    ) {}

    public function index(ProductIndexRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $perPage = (int) ($filters['per_page'] ?? 12);

        $payload = app(ListCacheService::class)->rememberRequest('api.products', $request, function () use ($filters, $perPage, $request): array {
            return $this->productCatalogService->paginate(
                $this->productCatalogService->buildListingQuery($filters),
                $perPage,
                $request
            );
        });

        return $this->successResponseWithMeta(
            $payload['data'],
            $payload['meta'],
            'Products retrieved successfully'
        );
    }

    public function show(string $slug): JsonResponse
    {
        $product = $this->productCatalogService->baseQuery()
            ->with([
                'unit',
                'specifications' => fn ($query) => $query->latest(),
                'variants.options',
            ])
            ->where('slug', $slug)
            ->first();

        if (! $product) {
            return $this->errorResponse('Product not found', 404);
        }

        return $this->successResponse(
            ProductDetailResource::make($product)->resolve(),
            'Product retrieved successfully'
        );
    }
}
