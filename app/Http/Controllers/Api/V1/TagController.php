<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\TagIndexRequest;
use App\Http\Resources\Api\V1\TagResource;
use App\Models\Term;
use App\Models\TermTaxonomy;
use App\Services\Cache\ListCacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class TagController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: '/api/v1/tags',
        description: 'Returns a paginated list of tags.',
        summary: 'Get list of tags',
        tags: ['Tags'],
        parameters: [
            new OA\Parameter(
                name: 'search',
                description: 'Search by tag name or slug.',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'string', nullable: true),
            ),
            new OA\Parameter(
                name: 'per_page',
                description: 'Items per page. Min 1, max 100.',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'integer', default: 15, maximum: 100, minimum: 1),
            ),
            new OA\Parameter(
                name: 'page',
                description: 'Page number.',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'integer', default: 1, minimum: 1),
            ),
            new OA\Parameter(
                name: 'sort',
                description: 'Sort order.',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'string', default: 'latest', enum: ['latest', 'oldest', 'name_asc', 'name_desc']),
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Tags retrieved successfully.',
                content: new OA\JsonContent(
                    required: ['success', 'message', 'data', 'meta'],
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Tags retrieved successfully'),
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(
                                required: ['id', 'name', 'slug', 'description', 'created_at', 'updated_at'],
                                properties: [
                                    new OA\Property(property: 'id', type: 'integer', example: 1),
                                    new OA\Property(property: 'name', type: 'string', example: 'Bunga Papan'),
                                    new OA\Property(property: 'slug', type: 'string', example: 'bunga-papan'),
                                    new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Description of the tag'),
                                    new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
                                    new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
                                ]
                            ),
                        ),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ],
                    type: 'object',
                ),
            ),
        ],
    )]
    public function index(TagIndexRequest $request): JsonResponse
    {
        $payload = app(ListCacheService::class)->rememberRequest('api.tags', $request, function () use ($request): array {
            $filters = $request->validated();
            $search = $filters['search'] ?? null;
            $sort = $filters['sort'] ?? 'latest';
            $perPage = $filters['per_page'] ?? 15;

            $query = TermTaxonomy::with('term')->where('taxonomy', 'tags');

            if ($search) {
                $query->whereHas('term', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            }

            match ($sort) {
                'oldest' => $query->orderBy('created_at', 'asc'),
                'name_asc' => $query->orderBy(
                    Term::select('name')->whereColumn('terms.id', 'term_taxonomy.term_id'),
                    'asc'
                ),
                'name_desc' => $query->orderBy(
                    Term::select('name')->whereColumn('terms.id', 'term_taxonomy.term_id'),
                    'desc'
                ),
                default => $query->orderBy('created_at', 'desc'),
            };

            $tags = $query->paginate($perPage);

            return [
                'data' => TagResource::collection($tags->getCollection())->resolve($request),
                'meta' => [
                    'current_page' => $tags->currentPage(),
                    'per_page' => $tags->perPage(),
                    'total' => $tags->total(),
                    'last_page' => $tags->lastPage(),
                ],
            ];
        });

        return $this->successResponseWithMeta(
            $payload['data'],
            $payload['meta'],
            'Tags retrieved successfully'
        );
    }

    #[OA\Get(
        path: '/api/v1/tags/{slug}',
        description: 'Returns tag detail by slug.',
        summary: 'Get tag detail by slug',
        tags: ['Tags'],
        parameters: [
            new OA\Parameter(
                name: 'slug',
                description: 'Tag slug.',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', example: 'bunga-papan'),
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Tag retrieved successfully.',
                content: new OA\JsonContent(
                    required: ['success', 'message', 'data'],
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Tag retrieved successfully'),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            required: ['id', 'name', 'slug', 'description', 'created_at', 'updated_at'],
                            properties: [
                                new OA\Property(property: 'id', type: 'integer', example: 1),
                                new OA\Property(property: 'name', type: 'string', example: 'Bunga Papan'),
                                new OA\Property(property: 'slug', type: 'string', example: 'bunga-papan'),
                                new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Description of the tag'),
                                new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
                                new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
                            ]
                        ),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 404,
                description: 'Tag not found.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: false),
                        new OA\Property(property: 'message', type: 'string', example: 'Tag not found'),
                    ],
                    type: 'object',
                ),
            ),
        ],
    )]
    public function show(Request $request, string $slug): JsonResponse
    {
        $payload = app(ListCacheService::class)->rememberRequest("api.tags.show.{$slug}", $request, function () use ($request, $slug): ?array {
            $tag = TermTaxonomy::with('term')
                ->where('taxonomy', 'tags')
                ->whereHas('term', function ($q) use ($slug) {
                    $q->where('slug', $slug);
                })
                ->first();

            if (! $tag) {
                return null;
            }

            return TagResource::make($tag)->resolve($request);
        });

        if (! $payload) {
            return $this->errorResponse('Tag not found', 404);
        }

        return $this->successResponse(
            $payload,
            'Tag retrieved successfully'
        );
    }
}
