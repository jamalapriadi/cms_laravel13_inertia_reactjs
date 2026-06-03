<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ProductIndexRequest;
use App\Http\Resources\Api\V1\ProductDetailResource;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Shop\Product;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    use ApiResponse;

    public function index(ProductIndexRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $perPage = (int) ($filters['per_page'] ?? 12);

        $products = $this->publicProductQuery()
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $searchQuery) use ($search): void {
                    $searchQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('brand', fn (Builder $brandQuery) => $brandQuery->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('category', fn (Builder $categoryQuery) => $categoryQuery->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('variantItems', fn (Builder $variantQuery) => $variantQuery->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%"));
                });
            })
            ->when($filters['category'] ?? null, function (Builder $query, string $category): void {
                $query->whereHas('category', function (Builder $categoryQuery) use ($category): void {
                    $categoryQuery->where('slug', $category)->orWhere('id', $category);
                });
            })
            ->when($filters['brand'] ?? null, function (Builder $query, string $brand): void {
                $query->whereHas('brand', function (Builder $brandQuery) use ($brand): void {
                    $brandQuery->where('slug', $brand)->orWhere('id', $brand);
                });
            })
            ->when($filters['collection'] ?? null, function (Builder $query, string $collection): void {
                $query->whereHas('collectionItems.collection', function (Builder $collectionQuery) use ($collection): void {
                    $collectionQuery->active()
                        ->where(function (Builder $slugQuery) use ($collection): void {
                            $slugQuery->where('slug', $collection)->orWhere('id', $collection);
                        });
                });
            });

        $this->applySort($products, (string) ($filters['sort'] ?? 'latest'));

        $paginator = $products->paginate($perPage)->withQueryString();

        return $this->successResponseWithMeta(
            ProductResource::collection($paginator->getCollection())->resolve($request),
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
            'Products retrieved successfully'
        );
    }

    public function show(string $slug): JsonResponse
    {
        $product = $this->publicProductQuery()
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

    private function publicProductQuery(): Builder
    {
        return Product::query()
            ->where('is_publish', true)
            ->whereHas('category', fn (Builder $categoryQuery) => $categoryQuery->where('is_publish', true))
            ->where(function (Builder $query): void {
                $query->whereNull('brand_id')
                    ->orWhereHas('brand', fn (Builder $brandQuery) => $brandQuery->where('is_active', true));
            })
            ->with([
                'category',
                'brand',
                'images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order')->latest(),
                'variantItems' => fn ($query) => $query
                    ->where('is_active', true)
                    ->with(['unit', 'options.variant'])
                    ->withCount('availableStockUnits')
                    ->orderBy('selling_price'),
            ])
            ->withCount('availableStockUnits');
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'oldest' => $query->orderBy('created_at')->orderBy('id'),
            'name' => $query->orderBy('name')->orderByDesc('created_at'),
            'price_low' => $query->orderBy('base_price')->orderByDesc('created_at'),
            'price_high' => $query->orderByDesc('base_price')->orderByDesc('created_at'),
            default => $query->latest('created_at')->latest('id'),
        };
    }
}
