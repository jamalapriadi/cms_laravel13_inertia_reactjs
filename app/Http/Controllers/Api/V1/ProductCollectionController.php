<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ProductIndexRequest;
use App\Http\Resources\Api\V1\ProductCollectionDetailResource;
use App\Http\Resources\Api\V1\ProductCollectionResource;
use App\Models\Shop\ProductCollection;
use App\Services\Api\V1\ProductCatalogService;
use App\Services\Cache\ListCacheService;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductCollectionController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ProductCatalogService $productCatalogService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $collections = app(ListCacheService::class)->rememberRequest('api.product-collections', $request, function () use ($request): array {
            $collections = ProductCollection::query()
                ->active()
                ->withCount('items')
                ->with([
                    'items' => fn ($query) => $query
                        ->whereHas('product', fn (Builder $productQuery) => $this->productCatalogService->constrainPublicVisibility($productQuery))
                        ->with([
                            'product' => fn (Builder $productQuery) => $this->productCatalogService->decorateProductCardQuery(
                                $this->productCatalogService->constrainPublicVisibility($productQuery)
                            ),
                            'variantItem' => fn ($variantQuery) => $variantQuery
                                ->where('is_active', true)
                                ->with(['unit', 'options.variant'])
                                ->withCount('availableStockUnits'),
                        ])
                        ->orderBy('sort_order')
                        ->latest(),
                ])
                ->orderBy('sort_order')
                ->latest()
                ->get();

            return ProductCollectionResource::collection($collections)->resolve($request);
        });

        return $this->successResponse(
            $collections,
            'Product collections retrieved successfully'
        );
    }

    public function showBySlug(ProductIndexRequest $request, string $slug): JsonResponse
    {
        $filters = $request->validated();

        $payload = app(ListCacheService::class)->rememberRequest("api.product-collections.show.{$slug}", $request, function () use ($filters, $request, $slug): ?array {
            $collection = ProductCollection::query()
                ->active()
                ->withCount('items')
                ->where('slug', $slug)
                ->first();

            if (! $collection) {
                return null;
            }

            $products = $this->productCatalogService->paginateForFilters(
                $filters,
                $request,
                ['collection_id' => $collection->id]
            );

            return [
                ...ProductCollectionDetailResource::make($collection)->resolve($request),
                'products' => $products,
            ];
        });

        if (! $payload) {
            return $this->errorResponse('Product collection not found', 404);
        }

        return $this->successResponse(
            $payload,
            'Product collection retrieved successfully'
        );
    }
}
