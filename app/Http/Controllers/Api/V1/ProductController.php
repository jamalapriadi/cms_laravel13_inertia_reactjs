<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ProductIndexRequest;
use App\Http\Resources\Api\V1\ProductDetailResource;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Shop\Product;
use App\Services\Cache\ListCacheService;
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

        $payload = app(ListCacheService::class)->rememberRequest('api.products', $request, function () use ($filters, $perPage, $request): array {
            $products = $this->publicProductQuery();

            $this->applyFilters($products, $filters);

            $this->applySort($products, (string) ($filters['sort'] ?? 'latest'));

            $paginator = $products->paginate($perPage)->withQueryString();

            return [
                'data' => ProductResource::collection($paginator->getCollection())->resolve($request),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                ],
            ];
        });

        return $this->successResponseWithMeta(
            $payload['data'],
            $payload['meta'],
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

    /**
     * Analisa sumber harga/stok:
     * - Project ini tidak menyimpan harga jual customer di product_stock_units.
     * - Produk tanpa variant fallback ke products.base_price.
     * - Produk dengan variant memakai variant_items.selling_price milik item aktif.
     * - buying_price / cost style fields tidak dipakai untuk katalog frontend.
     * - Stok frontend dihitung dari product_stock_units berstatus available, dan stock unit
     *   milik variant hanya dihitung bila variant item-nya aktif.
     */
    private function publicProductQuery(): Builder
    {
        return Product::query()
            ->select('products.*')
            ->where('is_publish', true)
            ->whereHas('category', fn (Builder $categoryQuery) => $categoryQuery->where('is_publish', true))
            ->where(function (Builder $query): void {
                $query->whereNull('brand_id')
                    ->orWhereHas('brand', fn (Builder $brandQuery) => $brandQuery->where('is_active', true));
            })
            ->withMin('activeVariantItems as variant_min_price', 'selling_price')
            ->withMax('activeVariantItems as variant_max_price', 'selling_price')
            ->withCount(['frontendAvailableStockUnits as stock_total'])
            ->with([
                'category',
                'brand',
                'images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order')->latest(),
                'variantItems' => fn ($query) => $query
                    ->where('is_active', true)
                    ->with(['unit', 'options.variant'])
                    ->withCount('availableStockUnits')
                    ->orderBy('selling_price'),
            ]);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
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
            default => $query->latest('created_at')->latest('id'),
        };
    }
}
