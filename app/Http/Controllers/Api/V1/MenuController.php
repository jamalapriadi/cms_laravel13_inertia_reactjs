<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\MenuShowRequest;
use App\Http\Resources\Api\V1\MenuResource;
use App\Services\Dashboard\MenuService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class MenuController extends Controller
{
    use ApiResponse;

    public function show(MenuShowRequest $request, string $slug, MenuService $menuService): JsonResponse
    {
        $locale = strtolower((string) ($request->validated('locale') ?: app()->getLocale()));

        $payload = list_cache()->rememberRequest('api.menus', $request, function () use ($menuService, $slug, $locale) {
            return $menuService->getResolvedMenu($slug, $locale);
        });

        if (! $payload) {
            return $this->errorResponse('Menu not found', 404);
        }

        return $this->successResponse(
            MenuResource::make($payload)->resolve($request),
            'Menu retrieved successfully'
        );
    }
}
