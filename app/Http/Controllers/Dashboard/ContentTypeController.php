<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\ContentType\ContentTypeRequest;
use App\Models\ContentType;
use App\Services\DynamicContent\ContentTypeService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContentTypeController extends Controller
{
    public function __construct(
        private readonly ContentTypeService $contentTypeService
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $props = list_cache()->rememberRequest('content-types', $request, function () use ($search) {
            $contentTypes = ContentType::query()
                ->withCount(['entries', 'fieldGroups'])
                ->when($search !== '', function ($query) use ($search): void {
                    $query->where(function ($query) use ($search): void {
                        $query->where('name', 'like', "%{$search}%")
                            ->orWhere('slug', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
                    });
                })
                ->orderBy('sort_order')
                ->latest('created_at')
                ->paginate(10)
                ->withQueryString()
                ->through(fn (ContentType $contentType) => $this->contentTypePayload($contentType));

            return [
                'contentTypes' => $contentTypes,
                'filters' => [
                    'search' => $search,
                ],
            ];
        });

        return Inertia::render('Dashboard/ContentTypes/Index', $props);
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/ContentTypes/Create');
    }

    public function store(ContentTypeRequest $request)
    {
        $this->contentTypeService->create($request->validated(), $request->user()?->id);

        return redirect()->route('content-types.index')
            ->with('success', 'Content type created successfully.');
    }

    public function edit(ContentType $contentType): Response
    {
        return Inertia::render('Dashboard/ContentTypes/Edit', [
            'contentType' => $this->contentTypePayload($contentType->loadCount(['entries', 'fieldGroups'])),
        ]);
    }

    public function update(ContentTypeRequest $request, ContentType $contentType)
    {
        $this->contentTypeService->update($contentType, $request->validated(), $request->user()?->id);

        return redirect()->route('content-types.index')
            ->with('success', 'Content type updated successfully.');
    }

    public function destroy(ContentType $contentType)
    {
        $this->contentTypeService->delete($contentType);

        return redirect()->route('content-types.index')
            ->with('success', 'Content type deleted successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function contentTypePayload(ContentType $contentType): array
    {
        return [
            'id' => $contentType->id,
            'name' => $contentType->name,
            'slug' => $contentType->slug,
            'description' => $contentType->description,
            'icon' => $contentType->icon,
            'is_active' => (bool) $contentType->is_active,
            'sort_order' => $contentType->sort_order,
            'entries_count' => $contentType->entries_count ?? 0,
            'field_groups_count' => $contentType->field_groups_count ?? 0,
            'created_at' => $contentType->created_at?->toIso8601String(),
            'updated_at' => $contentType->updated_at?->toIso8601String(),
        ];
    }
}
