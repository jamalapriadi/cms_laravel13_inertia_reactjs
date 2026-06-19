<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\KelurahanResource;
use App\Models\Dashboard\Kelurahan;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KelurahanController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $perPage = $this->getValidPerPage($request->query('per_page'));

        $query = Kelurahan::query()
            ->search($request->query('search'))
            ->sort($request->query('sort'), $request->query('direction'));

        if ($request->filled('kecamatan_id')) {
            $query->where('kecamatan_id', $request->query('kecamatan_id'));
        } elseif ($request->filled('kabupaten_id')) {
            $query->whereHas('kecamatan', function ($q) use ($request) {
                $q->where('kabupaten_id', $request->query('kabupaten_id'));
            });
        } elseif ($request->filled('province_id')) {
            $query->whereHas('kecamatan.kabupaten', function ($q) use ($request) {
                $q->where('province_id', $request->query('province_id'));
            });
        }

        $kelurahans = $query->paginate($perPage)->withQueryString();

        return $this->successResponse(
            KelurahanResource::collection($kelurahans)->response()->getData(true),
            'Kelurahans retrieved successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        $kelurahan = Kelurahan::find($id);

        if (! $kelurahan) {
            return $this->errorResponse('Kelurahan not found', 404);
        }

        return $this->successResponse(
            new KelurahanResource($kelurahan),
            'Kelurahan retrieved successfully'
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
