<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProductCollectionResource;
use App\Models\Shop\ProductCollection;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductCollectionController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $collections = ProductCollection::query()
            ->active()
            ->withCount('items')
            ->with([
                'items' => fn ($query) => $query
                    ->whereHas('product', fn (Builder $productQuery) => $this->publicProductConstraint($productQuery))
                    ->with([
                        'product' => fn (Builder $productQuery) => $this->publicProductConstraint($productQuery)
                            ->with([
                                'category',
                                'brand',
                                'images' => fn ($imageQuery) => $imageQuery->orderByDesc('is_primary')->orderBy('sort_order')->latest(),
                                'variantItems' => fn ($variantQuery) => $variantQuery
                                    ->where('is_active', true)
                                    ->with(['unit', 'options.variant'])
                                    ->withCount('availableStockUnits')
                                    ->orderBy('selling_price'),
                            ])
                            ->withCount('availableStockUnits'),
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

        return $this->successResponse(
            ProductCollectionResource::collection($collections)->resolve($request),
            'Product collections retrieved successfully'
        );
    }

    private function publicProductConstraint(Builder $query): Builder
    {
        return $query
            ->where('is_publish', true)
            ->whereHas('category', fn (Builder $categoryQuery) => $categoryQuery->where('is_publish', true))
            ->where(function (Builder $builder): void {
                $builder->whereNull('brand_id')
                    ->orWhereHas('brand', fn (Builder $brandQuery) => $brandQuery->where('is_active', true));
            });
    }
}
