<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\KecamatanResource;
use App\Http\Resources\Api\V1\KelurahanResource;
use App\Models\Dashboard\Kecamatan;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KecamatanController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $perPage = $this->getValidPerPage($request->query('per_page'));

        $query = Kecamatan::query()
            ->search($request->query('search'))
            ->sort($request->query('sort'), $request->query('direction'));

        if ($request->filled('kabupaten_id')) {
            $query->where('kabupaten_id', $request->query('kabupaten_id'));
        } elseif ($request->filled('province_id')) {
            $query->whereHas('kabupaten', function ($q) use ($request) {
                $q->where('province_id', $request->query('province_id'));
            });
        }

        $kecamatans = $query->paginate($perPage)->withQueryString();

        return $this->successResponse(
            KecamatanResource::collection($kecamatans)->response()->getData(true),
            'Kecamatans retrieved successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        $kecamatan = Kecamatan::find($id);

        if (! $kecamatan) {
            return $this->errorResponse('Kecamatan not found', 404);
        }

        return $this->successResponse(
            new KecamatanResource($kecamatan),
            'Kecamatan retrieved successfully'
        );
    }

    public function kelurahans(Request $request, string $id): JsonResponse
    {
        $kecamatan = Kecamatan::find($id);

        if (! $kecamatan) {
            return $this->errorResponse('Kecamatan not found', 404);
        }

        $perPage = $this->getValidPerPage($request->query('per_page'));

        $kelurahans = $kecamatan->kelurahans()
            ->search($request->query('search'))
            ->sort($request->query('sort'), $request->query('direction'))
            ->paginate($perPage)
            ->withQueryString();

        return $this->successResponse(
            KelurahanResource::collection($kelurahans)->response()->getData(true),
            'Kelurahans retrieved successfully'
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
