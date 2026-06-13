<?php

namespace Jamalapriadi\DynamicContentBuilder\Http\Controllers\Dashboard;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Jamalapriadi\DynamicContentBuilder\Http\Requests\Dashboard\CustomFieldGroupRequest;
use Jamalapriadi\DynamicContentBuilder\Http\Requests\Dashboard\CustomFieldRequest;
use Jamalapriadi\DynamicContentBuilder\Models\ContentType;
use Jamalapriadi\DynamicContentBuilder\Models\CustomField;
use Jamalapriadi\DynamicContentBuilder\Models\CustomFieldGroup;
use Jamalapriadi\DynamicContentBuilder\Services\CustomFieldGroupService;
use Jamalapriadi\DynamicContentBuilder\Services\DynamicContentFieldService;
use Jamalapriadi\DynamicContentBuilder\Support\DynamicContent;

class CustomFieldGroupController extends Controller
{
    public function __construct(
        private readonly CustomFieldGroupService $customFieldGroupService,
        private readonly DynamicContentFieldService $dynamicContentFieldService,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $groups = CustomFieldGroup::query()
            ->with('contentType:id,name,slug')
            ->withCount('fields')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('contentType', function ($query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%")
                                ->orWhere('slug', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('sort_order')
            ->latest('created_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (CustomFieldGroup $group) => $this->groupPayload($group));

        return Inertia::render('Dashboard/CustomFields/Index', [
            'customFieldGroups' => $groups,
            'filters' => [
                'search' => $search,
            ],
            'urls' => [
                'index' => route('custom-fields.index'),
                'create' => route('custom-fields.create'),
                'store' => route('custom-fields.store'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/CustomFields/Create', [
            'contentTypes' => $this->contentTypeOptions(),
            'fieldTypeOptions' => DynamicContent::fieldTypeOptions(),
            'urls' => [
                'index' => route('custom-fields.index'),
                'store' => route('custom-fields.store'),
            ],
        ]);
    }

    public function store(CustomFieldGroupRequest $request)
    {
        $group = $this->customFieldGroupService->createGroup($request->validated());

        return redirect()->route('custom-fields.edit', $group)
            ->with('success', 'Field group created successfully.');
    }

    public function edit(CustomFieldGroup $customFieldGroup): Response
    {
        $customFieldGroup->load([
            'contentType:id,name,slug',
            'fields' => fn ($query) => $query->orderBy('sort_order')->orderBy('label'),
        ]);

        return Inertia::render('Dashboard/CustomFields/Edit', [
            'customFieldGroup' => $this->groupPayload($customFieldGroup, withFields: true),
            'contentTypes' => $this->contentTypeOptions(),
            'fieldTypeOptions' => DynamicContent::fieldTypeOptions(),
            'urls' => [
                'index' => route('custom-fields.index'),
                'update' => route('custom-fields.update', $customFieldGroup),
                'destroy' => route('custom-fields.destroy', $customFieldGroup),
                'field_store' => route('custom-fields.fields.store', $customFieldGroup),
                'field_update' => route('custom-fields.fields.update', [
                    'customFieldGroup' => $customFieldGroup,
                    'customField' => '__FIELD__',
                ]),
                'field_destroy' => route('custom-fields.fields.destroy', [
                    'customFieldGroup' => $customFieldGroup,
                    'customField' => '__FIELD__',
                ]),
                'field_move' => route('custom-fields.fields.move', [
                    'customFieldGroup' => $customFieldGroup,
                    'customField' => '__FIELD__',
                ]),
            ],
        ]);
    }

    public function update(CustomFieldGroupRequest $request, CustomFieldGroup $customFieldGroup)
    {
        $this->customFieldGroupService->updateGroup($customFieldGroup, $request->validated());

        return redirect()->route('custom-fields.edit', $customFieldGroup)
            ->with('success', 'Field group updated successfully.');
    }

    public function destroy(CustomFieldGroup $customFieldGroup)
    {
        $this->customFieldGroupService->deleteGroup($customFieldGroup);

        return redirect()->route('custom-fields.index')
            ->with('success', 'Field group deleted successfully.');
    }

    public function storeField(CustomFieldRequest $request, CustomFieldGroup $customFieldGroup)
    {
        $this->customFieldGroupService->createField($customFieldGroup, $request->validated());

        return redirect()->route('custom-fields.edit', $customFieldGroup)
            ->with('success', 'Custom field created successfully.');
    }

    public function updateField(CustomFieldRequest $request, CustomFieldGroup $customFieldGroup, CustomField $customField)
    {
        $this->customFieldGroupService->updateField($customFieldGroup, $customField, $request->validated());

        return redirect()->route('custom-fields.edit', $customFieldGroup)
            ->with('success', 'Custom field updated successfully.');
    }

    public function destroyField(CustomFieldGroup $customFieldGroup, CustomField $customField)
    {
        $this->customFieldGroupService->deleteField($customFieldGroup, $customField);

        return redirect()->route('custom-fields.edit', $customFieldGroup)
            ->with('success', 'Custom field deleted successfully.');
    }

    public function moveField(Request $request, CustomFieldGroup $customFieldGroup, CustomField $customField)
    {
        $validated = $request->validate([
            'direction' => ['required', 'string', Rule::in(['up', 'down'])],
        ]);

        $this->customFieldGroupService->moveField($customFieldGroup, $customField, $validated['direction']);

        return redirect()->route('custom-fields.edit', $customFieldGroup)
            ->with('success', 'Custom field order updated successfully.');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function contentTypeOptions(): array
    {
        return ContentType::query()
            ->active()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (ContentType $contentType) => [
                'id' => $contentType->id,
                'name' => $contentType->name,
                'slug' => $contentType->slug,
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function groupPayload(CustomFieldGroup $group, bool $withFields = false): array
    {
        return [
            'id' => $group->id,
            'name' => $group->name,
            'slug' => $group->slug,
            'description' => $group->description,
            'target_type' => $group->target_type,
            'target_id' => $group->target_id,
            'is_active' => (bool) $group->is_active,
            'sort_order' => $group->sort_order,
            'fields_count' => $group->fields_count ?? $group->fields->count(),
            'content_type' => $group->contentType ? [
                'id' => $group->contentType->id,
                'name' => $group->contentType->name,
                'slug' => $group->contentType->slug,
            ] : null,
            'fields' => $withFields
                ? $group->fields
                    ->map(fn (CustomField $field) => $this->dynamicContentFieldService->fieldPayload($field, $field->default_value))
                    ->values()
                    ->all()
                : [],
            'created_at' => $group->created_at?->toIso8601String(),
            'updated_at' => $group->updated_at?->toIso8601String(),
        ];
    }
}
