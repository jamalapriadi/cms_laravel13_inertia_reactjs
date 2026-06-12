<?php

namespace App\Services\Api\V1;

use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Shop\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class ProductCatalogService
{
    public function baseQuery(): Builder
    {
        return $this->decorateProductCardQuery(
            $this->constrainPublicVisibility(Product::query())
        );
    }

    public function constrainPublicVisibility(Builder $query): Builder
    {
        return $query
            ->where('is_publish', true)
            ->whereHas('category', fn (Builder $categoryQuery) => $categoryQuery->where('is_publish', true))
            ->where(function (Builder $builder): void {
                $builder->whereNull('brand_id')
                    ->orWhereHas('brand', fn (Builder $brandQuery) => $brandQuery->where('is_active', true));
            });
    }

    public function decorateProductCardQuery(Builder $query): Builder
    {
        return $query
            ->select('products.*')
            ->withMin('activeVariantItems as variant_min_price', 'selling_price')
            ->withMax('activeVariantItems as variant_max_price', 'selling_price')
            ->withCount(['frontendAvailableStockUnits as stock_total'])
            ->withSum([
                'orderItems as sold_count' => function (Builder $orderItemQuery): void {
                    $orderItemQuery->whereHas('order', function (Builder $orderQuery): void {
                        $orderQuery
                            ->where('payment_status', 'paid')
                            ->where('status', '!=', 'cancelled');
                    });
                },
            ], 'qty')
            ->with([
                'category',
                'brand',
                'images' => fn ($imageQuery) => $imageQuery->orderByDesc('is_primary')->orderBy('sort_order')->latest(),
                'variantItems' => fn ($variantQuery) => $variantQuery
                    ->where('is_active', true)
                    ->with(['unit', 'options.variant'])
                    ->withCount('availableStockUnits')
                    ->orderBy('selling_price'),
            ]);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @param  array<string, mixed>  $locks
     */
    public function buildListingQuery(array $filters = [], array $locks = []): Builder
    {
        $query = $this->baseQuery();

        $this->applyLockedContext($query, $locks);
        $this->applyFilters($query, $filters, $locks);
        $this->applySort($query, (string) ($filters['sort'] ?? 'latest'));

        return $query;
    }

    public function paginate(Builder $query, int $perPage, Request $request): array
    {
        $paginator = $query->paginate($perPage)->withQueryString();

        return $this->resolvePaginator($paginator, $request);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @param  array<string, mixed>  $locks
     * @return array{data: array<int, array<string, mixed>>, meta: array<string, int>}
     */
    public function paginateForFilters(array $filters, Request $request, array $locks = []): array
    {
        $perPage = (int) ($filters['per_page'] ?? 12);

        return $this->paginate(
            $this->buildListingQuery($filters, $locks),
            $perPage,
            $request
        );
    }

    /**
     * @param  array<string, mixed>  $locks
     */
    private function applyLockedContext(Builder $query, array $locks): void
    {
        if ($categoryIds = $locks['category_ids'] ?? null) {
            $query->whereIn('products.category_id', $categoryIds);
        }

        if ($brandId = $locks['brand_id'] ?? null) {
            $query->where('products.brand_id', $brandId);
        }

        if ($collectionId = $locks['collection_id'] ?? null) {
            $query->whereHas('collectionItems', fn (Builder $itemQuery) => $itemQuery->where('product_collection_id', $collectionId));
        }
    }

    /**
     * @param  array<string, mixed>  $filters
     * @param  array<string, mixed>  $locks
     */
    private function applyFilters(Builder $query, array $filters, array $locks): void
    {
        $minPrice = array_key_exists('min_price', $filters) ? (float) $filters['min_price'] : null;
        $maxPrice = array_key_exists('max_price', $filters) ? (float) $filters['max_price'] : null;

        $query
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $searchQuery) use ($search): void {
                    $searchQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('brand', fn (Builder $brandQuery) => $brandQuery->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('category', fn (Builder $categoryQuery) => $categoryQuery->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('activeVariantItems', function (Builder $variantQuery) use ($search): void {
                            $variantQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('sku', 'like', "%{$search}%");
                        });
                });
            })
            ->when(! isset($locks['category_ids']) ? ($filters['category'] ?? null) : null, function (Builder $query, string $category): void {
                $query->whereHas('category', function (Builder $categoryQuery) use ($category): void {
                    $categoryQuery->where('slug', $category)->orWhere('id', $category);
                });
            })
            ->when(! isset($locks['category_ids']) ? ($filters['category_id'] ?? null) : null, fn (Builder $query, string $categoryId) => $query->where('products.category_id', $categoryId))
            ->when(! isset($locks['brand_id']) ? ($filters['brand'] ?? null) : null, function (Builder $query, string $brand): void {
                $query->whereHas('brand', function (Builder $brandQuery) use ($brand): void {
                    $brandQuery->where('slug', $brand)->orWhere('id', $brand);
                });
            })
            ->when(! isset($locks['brand_id']) ? ($filters['brand_id'] ?? null) : null, fn (Builder $query, string $brandId) => $query->where('products.brand_id', $brandId))
            ->when(! isset($locks['collection_id']) ? ($filters['collection'] ?? null) : null, function (Builder $query, string $collection): void {
                $query->whereHas('collectionItems.collection', function (Builder $collectionQuery) use ($collection): void {
                    $collectionQuery->active()
                        ->where(function (Builder $slugQuery) use ($collection): void {
                            $slugQuery->where('slug', $collection)->orWhere('id', $collection);
                        });
                });
            })
            ->when(($filters['has_stock'] ?? null) === true, fn (Builder $query) => $query->whereHas('frontendAvailableStockUnits'));

        $this->applyPriceRangeFilter($query, $minPrice, $maxPrice);
    }

    private function applyPriceRangeFilter(Builder $query, ?float $minPrice, ?float $maxPrice): void
    {
        if ($minPrice === null && $maxPrice === null) {
            return;
        }

        $query->where(function (Builder $priceQuery) use ($minPrice, $maxPrice): void {
            $priceQuery
                ->whereHas('activeVariantItems', function (Builder $variantQuery) use ($minPrice, $maxPrice): void {
                    if ($minPrice !== null) {
                        $variantQuery->where('selling_price', '>=', $minPrice);
                    }

                    if ($maxPrice !== null) {
                        $variantQuery->where('selling_price', '<=', $maxPrice);
                    }
                })
                ->orWhere(function (Builder $basePriceQuery) use ($minPrice, $maxPrice): void {
                    $basePriceQuery->whereDoesntHave('activeVariantItems');

                    if ($minPrice !== null) {
                        $basePriceQuery->where('base_price', '>=', $minPrice);
                    }

                    if ($maxPrice !== null) {
                        $basePriceQuery->where('base_price', '<=', $maxPrice);
                    }
                });
        });
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'oldest' => $query->orderBy('created_at')->orderBy('id'),
            'name', 'name_asc' => $query->orderBy('name')->orderByDesc('created_at'),
            'name_desc' => $query->orderByDesc('name')->orderByDesc('created_at'),
            'price_low', 'price_asc' => $query->orderByRaw('COALESCE(variant_min_price, products.base_price) asc')
                ->orderByDesc('created_at')
                ->orderByDesc('id'),
            'price_high', 'price_desc' => $query->orderByRaw('COALESCE(variant_max_price, products.base_price) desc')
                ->orderByDesc('created_at')
                ->orderByDesc('id'),
            'best_selling' => $query->orderByDesc('sold_count')
                ->orderByDesc('created_at')
                ->orderByDesc('id'),
            default => $query->latest('created_at')->latest('id'),
        };
    }

    /**
     * @return array{data: array<int, array<string, mixed>>, meta: array<string, int>}
     */
    private function resolvePaginator(LengthAwarePaginator $paginator, Request $request): array
    {
        return [
            'data' => ProductResource::collection($paginator->getCollection())->resolve($request),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ];
    }
}
