<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class FaqController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        // TODO: Return active App\Models\Shop\Faq records through API resources.
        return $this->successResponse([
            'items' => [],
            'meta' => [
                'status' => 'placeholder',
            ],
        ], 'FAQs endpoint is ready');
    }
}
