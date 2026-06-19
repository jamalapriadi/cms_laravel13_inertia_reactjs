<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\KabupatenResource;
use App\Http\Resources\Api\V1\KecamatanResource;
use App\Models\Dashboard\Kabupaten;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KabupatenController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $perPage = $this->getValidPerPage($request->query('per_page'));

        $query = Kabupaten::query()
            ->search($request->query('search'))
            ->sort($request->query('sort'), $request->query('direction'));

        if ($request->filled('province_id')) {
            $query->where('province_id', $request->query('province_id'));
        }

        $kabupatens = $query->paginate($perPage)->withQueryString();

        return $this->successResponse(
            KabupatenResource::collection($kabupatens)->response()->getData(true),
            'Kabupatens retrieved successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        $kabupaten = Kabupaten::find($id);

        if (! $kabupaten) {
            return $this->errorResponse('Kabupaten not found', 404);
        }

        return $this->successResponse(
            new KabupatenResource($kabupaten),
            'Kabupaten retrieved successfully'
        );
    }

    public function kecamatans(Request $request, string $id): JsonResponse
    {
        $kabupaten = Kabupaten::find($id);

        if (! $kabupaten) {
            return $this->errorResponse('Kabupaten not found', 404);
        }

        $perPage = $this->getValidPerPage($request->query('per_page'));

        $kecamatans = $kabupaten->kecamatans()
            ->search($request->query('search'))
            ->sort($request->query('sort'), $request->query('direction'))
            ->paginate($perPage)
            ->withQueryString();

        return $this->successResponse(
            KecamatanResource::collection($kecamatans)->response()->getData(true),
            'Kecamatans retrieved successfully'
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
