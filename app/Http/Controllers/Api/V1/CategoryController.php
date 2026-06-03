<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\EcommerceCategoryResource;
use App\Models\Shop\Category;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
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

        return $this->successResponse(
            EcommerceCategoryResource::collection($categories)->resolve($request),
            'Categories retrieved successfully'
        );
    }
}
