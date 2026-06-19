<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\KabupatenResource;
use App\Http\Resources\Api\V1\ProvinceResource;
use App\Models\Dashboard\Province;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProvinceController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $perPage = $this->getValidPerPage($request->query('per_page'));

        $provinces = Province::query()
            ->search($request->query('search'))
            ->sort($request->query('sort'), $request->query('direction'))
            ->paginate($perPage)
            ->withQueryString();

        return $this->successResponse(
            ProvinceResource::collection($provinces)->response()->getData(true),
            'Provinces retrieved successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        $province = Province::find($id);

        if (! $province) {
            return $this->errorResponse('Province not found', 404);
        }

        return $this->successResponse(
            new ProvinceResource($province),
            'Province retrieved successfully'
        );
    }

    public function kabupatens(Request $request, string $id): JsonResponse
    {
        $province = Province::find($id);

        if (! $province) {
            return $this->errorResponse('Province not found', 404);
        }

        $perPage = $this->getValidPerPage($request->query('per_page'));

        $kabupatens = $province->kabupatens()
            ->search($request->query('search'))
            ->sort($request->query('sort'), $request->query('direction'))
            ->paginate($perPage)
            ->withQueryString();

        return $this->successResponse(
            KabupatenResource::collection($kabupatens)->response()->getData(true),
            'Kabupatens retrieved successfully'
        );
    }

    private function getValidPerPage(?string $perPage): int
    {
        $perPage = (int) $perPage;
        if ($perPage < 1) {
            return 15;
        }
        if ($perPage > 100) {
            return 100;
        }

        return $perPage;
    }
}
