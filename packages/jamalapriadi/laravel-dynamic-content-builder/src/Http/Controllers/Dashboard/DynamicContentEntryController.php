<?php

namespace Jamalapriadi\DynamicContentBuilder\Http\Controllers\Dashboard;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Jamalapriadi\DynamicContentBuilder\Http\Requests\Dashboard\ContentEntryRequest;
use Jamalapriadi\DynamicContentBuilder\Models\ContentEntry;
use Jamalapriadi\DynamicContentBuilder\Models\ContentType;
use Jamalapriadi\DynamicContentBuilder\Services\ContentEntryService;
use Jamalapriadi\DynamicContentBuilder\Services\DynamicContentFieldService;
use Jamalapriadi\DynamicContentBuilder\Support\DynamicContent;

class DynamicContentEntryController extends Controller
{
    public function __construct(
        private readonly ContentEntryService $contentEntryService,
        private readonly DynamicContentFieldService $dynamicContentFieldService,
    ) {}

    public function index(ContentType $contentType, Request $request): Response
    {
        $entries = $this->contentEntryService->paginateForDashboard($contentType, [
            'search' => trim((string) $request->query('search', '')),
            'status' => trim((string) $request->query('status', '')),
        ])->through(fn (ContentEntry $entry) => $this->entryPayload($entry));

        $fields = $this->dynamicContentFieldService->activeFieldsForContentType($contentType)
            ->map(fn ($field) => $this->dynamicContentFieldService->fieldPayload($field))
            ->all();

        return Inertia::render('Dashboard/DynamicContent/Index', [
            'contentType' => $this->contentTypePayload($contentType),
            'entries' => $entries,
            'fields' => $fields,
            'filters' => [
                'search' => trim((string) $request->query('search', '')),
                'status' => trim((string) $request->query('status', '')),
            ],
            'statusOptions' => DynamicContent::entryStatuses(),
            'urls' => $this->entryUrls($contentType),
        ]);
    }

    public function create(ContentType $contentType): Response
    {
        return Inertia::render('Dashboard/DynamicContent/Create', [
            'contentType' => $this->contentTypePayload($contentType),
            'fieldGroups' => $this->dynamicContentFieldService->schemaForContentType($contentType),
            'form' => $this->contentEntryService->formData($contentType),
            'statusOptions' => DynamicContent::entryStatuses(),
            'urls' => $this->entryUrls($contentType),
            'mediaLibrary' => $this->mediaLibraryUrls(),
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
            'statusOptions' => DynamicContent::entryStatuses(),
            'urls' => array_merge($this->entryUrls($contentType), [
                'update' => route('dynamic-content.update', [
                    'contentType' => $contentType->slug,
                    'contentEntry' => $contentEntry,
                ]),
                'destroy' => route('dynamic-content.destroy', [
                    'contentType' => $contentType->slug,
                    'contentEntry' => $contentEntry,
                ]),
            ]),
            'mediaLibrary' => $this->mediaLibraryUrls(),
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
            'relation_labels' => $this->resolveRelationLabels($entry),
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

    private function resolveRelationLabels(ContentEntry $entry): array
    {
        $labels = [];
        $contentType = $entry->contentType;
        if (! $contentType) {
            return [];
        }

        $fields = $this->dynamicContentFieldService->activeFieldsForContentType($contentType);
        foreach ($fields as $field) {
            if ($field->type === 'relation') {
                $val = $entry->data[$field->name] ?? null;
                if ($val) {
                    $config = $field->options;
                    $sourceTypeId = $config['source_content_type_id'] ?? null;
                    $labelField = $config['label_field'] ?? 'title';

                    if ($sourceTypeId) {
                        if ($config['is_multiple'] ?? false) {
                            $ids = is_array($val) ? $val : json_decode($val, true);
                            if (! is_array($ids)) {
                                $ids = [$val];
                            }
                            $names = [];
                            foreach ($ids as $id) {
                                $targetEntry = ContentEntry::find($id);
                                if ($targetEntry) {
                                    $names[] = $labelField === 'title'
                                        ? ($targetEntry->title ?? $id)
                                        : ($targetEntry->data[$labelField] ?? $targetEntry->title ?? $id);
                                } else {
                                    $names[] = '-';
                                }
                            }
                            $labels[$field->name] = implode(', ', $names);
                        } else {
                            $targetEntry = ContentEntry::find($val);
                            if ($targetEntry) {
                                $labels[$field->name] = $labelField === 'title'
                                    ? ($targetEntry->title ?? $val)
                                    : ($targetEntry->data[$labelField] ?? $targetEntry->title ?? $val);
                            } else {
                                $labels[$field->name] = 'Data tidak ditemukan';
                            }
                        }
                    }
                } else {
                    $labels[$field->name] = '-';
                }
            }
        }

        return $labels;
    }

    /**
     * @return array<string, string>
     */
    private function entryUrls(ContentType $contentType): array
    {
        return [
            'index' => route('dynamic-content.index', ['contentType' => $contentType->slug]),
            'create' => route('dynamic-content.create', ['contentType' => $contentType->slug]),
            'store' => route('dynamic-content.store', ['contentType' => $contentType->slug]),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function mediaLibraryUrls(): array
    {
        return [
            'index' => route('dynamic-content-builder.media.index'),
            'store' => route('dynamic-content-builder.media.store'),
        ];
    }
}
