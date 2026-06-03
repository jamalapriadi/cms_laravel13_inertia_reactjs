<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class HealthController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: '/api/v1',
        description: 'Returns API version and active status.',
        summary: 'API information',
        tags: ['Health'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Gitatrading Store API information.',
                content: new OA\JsonContent(
                    required: ['success', 'message', 'data'],
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Gitatrading Store API'),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(property: 'version', type: 'string', example: 'v1'),
                                new OA\Property(property: 'status', type: 'string', example: 'active'),
                            ],
                            type: 'object',
                        ),
                    ],
                    type: 'object',
                    example: [
                        'success' => true,
                        'message' => 'Gitatrading Store API',
                        'data' => ['version' => 'v1', 'status' => 'active'],
                    ],
                ),
            ),
        ],
    )]
    public function info(): JsonResponse
    {
        return $this->successResponse([
            'version' => 'v1',
            'status' => 'active',
        ], 'Gitatrading Store API');
    }

    #[OA\Get(
        path: '/api/v1/health',
        description: 'Returns a lightweight health check response for the REST API.',
        summary: 'API health check',
        tags: ['Health'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'API is running.',
                content: new OA\JsonContent(
                    required: ['success', 'message', 'data'],
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'API is running'),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(property: 'app', type: 'string', example: 'gitatrading-store'),
                                new OA\Property(property: 'version', type: 'string', example: 'v1'),
                            ],
                            type: 'object',
                        ),
                    ],
                    type: 'object',
                    example: [
                        'success' => true,
                        'message' => 'API is running',
                        'data' => ['app' => 'gitatrading-store', 'version' => 'v1'],
                    ],
                ),
            ),
        ],
    )]
    public function health(): JsonResponse
    {
        return $this->successResponse([
            'app' => 'gitatrading-store',
            'version' => 'v1',
        ], 'API is running');
    }
}
