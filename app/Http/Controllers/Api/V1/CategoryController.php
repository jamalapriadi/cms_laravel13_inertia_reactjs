<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ProductIndexRequest;
use App\Http\Resources\Api\V1\CategoryDetailResource;
use App\Http\Resources\Api\V1\EcommerceCategoryResource;
use App\Models\Shop\Category;
use App\Services\Api\V1\ProductCatalogService;
use App\Services\Cache\ListCacheService;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class CategoryController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ProductCatalogService $productCatalogService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $categories = app(ListCacheService::class)->rememberRequest('api.categories', $request, function () use ($request): array {
            $categories = Category::query()
                ->where('is_publish', true)
                ->whereNull('parent_id')
                ->with([
                    'children' => fn ($query) => $query
                        ->where('is_publish', true)
                        ->withCount(['products' => fn (Builder $productQuery) => $productQuery->where('is_publish', true)])
                        ->orderBy('sort_order')
                        ->orderBy('name'),
                ])
                ->withCount(['products' => fn (Builder $productQuery) => $productQuery->where('is_publish', true)])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();

            return EcommerceCategoryResource::collection($categories)->resolve($request);
        });

        return $this->successResponse(
            $categories,
            'Categories retrieved successfully'
        );
    }

    public function showBySlug(ProductIndexRequest $request, string $slug): JsonResponse
    {
        $filters = $request->validated();

        $payload = app(ListCacheService::class)->rememberRequest("api.categories.show.{$slug}", $request, function () use ($filters, $request, $slug): ?array {
            $category = Category::query()
                ->where('is_publish', true)
                ->with([
                    'parent' => fn ($query) => $query
                        ->where('is_publish', true)
                        ->with([
                            'children' => fn ($childQuery) => $childQuery
                                ->where('is_publish', true)
                                ->orderBy('sort_order')
                                ->orderBy('name'),
                        ]),
                    'children' => fn ($query) => $query
                        ->where('is_publish', true)
                        ->orderBy('sort_order')
                        ->orderBy('name'),
                ])
                ->where('slug', $slug)
                ->first();

            if (! $category) {
                return null;
            }

            $products = $this->productCatalogService->paginateForFilters(
                $filters,
                $request,
                ['category_ids' => $this->categoryIdsForListing($category)]
            );

            return [
                ...CategoryDetailResource::make($category)->resolve($request),
                'products' => $products,
            ];
        });

        if (! $payload) {
            return $this->errorResponse('Category not found', 404);
        }

        return $this->successResponse(
            $payload,
            'Category retrieved successfully'
        );
    }

    /**
     * @return list<string>
     */
    private function categoryIdsForListing(Category $category): array
    {
        $categories = Category::query()
            ->where('is_publish', true)
            ->get(['id', 'parent_id']);

        return [
            $category->id,
            ...$this->descendantCategoryIds($category->id, $categories),
        ];
    }

    /**
     * @param  Collection<int, Category>  $categories
     * @return list<string>
     */
    private function descendantCategoryIds(string $parentId, Collection $categories): array
    {
        return $categories
            ->where('parent_id', $parentId)
            ->flatMap(fn (Category $child) => [
                $child->id,
                ...$this->descendantCategoryIds($child->id, $categories),
            ])
            ->values()
            ->all();
    }
}
