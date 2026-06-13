<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\DynamicContent\ContentEntryRequest;
use App\Models\ContentEntry;
use App\Models\ContentType;
use App\Services\DynamicContent\ContentEntryService;
use App\Services\DynamicContent\DynamicContentFieldService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DynamicContentEntryController extends Controller
{
    public function __construct(
        private readonly ContentEntryService $contentEntryService,
        private readonly DynamicContentFieldService $dynamicContentFieldService,
    ) {}

    public function index(ContentType $contentType, Request $request): Response
    {
        $props = list_cache()->rememberRequest("dynamic-content:{$contentType->slug}", $request, function () use ($contentType, $request) {
            $entries = $this->contentEntryService->paginateForDashboard($contentType, [
                'search' => trim((string) $request->query('search', '')),
                'status' => trim((string) $request->query('status', '')),
            ])->through(fn (ContentEntry $entry) => $this->entryPayload($entry));

            return [
                'contentType' => $this->contentTypePayload($contentType),
                'entries' => $entries,
                'filters' => [
                    'search' => trim((string) $request->query('search', '')),
                    'status' => trim((string) $request->query('status', '')),
                ],
            ];
        });

        return Inertia::render('Dashboard/DynamicContent/Index', $props);
    }

    public function create(ContentType $contentType): Response
    {
        return Inertia::render('Dashboard/DynamicContent/Create', [
            'contentType' => $this->contentTypePayload($contentType),
            'fieldGroups' => $this->dynamicContentFieldService->schemaForContentType($contentType),
            'form' => $this->contentEntryService->formData($contentType),
        ]);
    }

    public function store(ContentType $contentType, ContentEntryRequest $request)
    {
        $this->contentEntryService->create($contentType, $request->validated(), $request->user()?->id);

        return redirect()->route('dynamic-content.index', $contentType->slug)
            ->with('success', 'Content entry created successfully.');
    }

    public function edit(ContentType $contentType, ContentEntry $contentEntry): Response
    {
        $this->contentEntryService->ensureBelongsToType($contentType, $contentEntry);

        return Inertia::render('Dashboard/DynamicContent/Edit', [
            'contentType' => $this->contentTypePayload($contentType),
            'contentEntry' => $this->entryPayload($contentEntry),
            'fieldGroups' => $this->dynamicContentFieldService->schemaForContentType($contentType, $contentEntry->data ?? []),
            'form' => $this->contentEntryService->formData($contentType, $contentEntry),
        ]);
    }

    public function update(ContentType $contentType, ContentEntry $contentEntry, ContentEntryRequest $request)
    {
        $this->contentEntryService->update($contentType, $contentEntry, $request->validated(), $request->user()?->id);

        return redirect()->route('dynamic-content.index', $contentType->slug)
            ->with('success', 'Content entry updated successfully.');
    }

    public function destroy(ContentType $contentType, ContentEntry $contentEntry)
    {
        $this->contentEntryService->delete($contentType, $contentEntry);

        return redirect()->route('dynamic-content.index', $contentType->slug)
            ->with('success', 'Content entry deleted successfully.');
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
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function entryPayload(ContentEntry $entry): array
    {
        return [
            'id' => $entry->id,
            'content_type_id' => $entry->content_type_id,
            'title' => $entry->title,
            'slug' => $entry->slug,
            'excerpt' => $entry->excerpt,
            'status' => $entry->status,
            'published_at' => $entry->published_at?->toIso8601String(),
            'sort_order' => $entry->sort_order,
            'data' => $entry->data ?? [],
            'created_at' => $entry->created_at?->toIso8601String(),
            'updated_at' => $entry->updated_at?->toIso8601String(),
            'creator' => $entry->creator ? [
                'id' => $entry->creator->id,
                'name' => $entry->creator->name,
            ] : null,
            'updater' => $entry->updater ? [
                'id' => $entry->updater->id,
                'name' => $entry->updater->name,
            ] : null,
        ];
    }
}
