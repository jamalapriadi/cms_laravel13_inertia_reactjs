<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    use ApiResponse;

    public function __invoke(): JsonResponse
    {
        // TODO: Compose homepage data from active banner slides, categories, collections, products, and FAQs through API resources.
        return $this->successResponse([
            'sections' => [],
            'meta' => [
                'status' => 'placeholder',
            ],
        ], 'Home endpoint is ready');
    }
}
