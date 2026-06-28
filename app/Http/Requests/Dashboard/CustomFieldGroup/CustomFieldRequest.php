<?php

namespace App\Http\Requests\Dashboard\CustomFieldGroup;

use App\Models\CustomField;
use App\Models\CustomFieldGroup;
use App\Support\DynamicContent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var CustomFieldGroup|null $group */
        $group = $this->route('customFieldGroup');
        /** @var CustomField|null $customField */
        $customField = $this->route('customField');

        $targetId = $group?->target_id;
        $fieldId = $customField?->id;

        return [
            'label' => ['required', 'string', 'max:255'],
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9_]+$/',
                Rule::notIn(DynamicContent::reservedFieldNames()),
                Rule::unique('custom_fields', 'name')
                    ->where(function ($query) use ($targetId) {
                        $query->whereNull('deleted_at')
                            ->whereIn('custom_field_group_id', function ($subQuery) use ($targetId) {
                                $subQuery->select('id')
                                    ->from('custom_field_groups')
                                    ->whereNull('deleted_at')
                                    ->where('target_type', 'content_type')
                                    ->where('target_id', $targetId);
                            });
                    })
                    ->ignore($fieldId),
            ],
            'type' => ['required', 'string', Rule::in(DynamicContent::fieldTypes())],
            'placeholder' => ['nullable', 'string', 'max:255'],
            'instructions' => ['nullable', 'string'],
            'options' => [
                Rule::requiredIf(fn () => $this->input('type') === 'relation'),
                'nullable',
                'array',
            ],
            'options.source_content_type_id' => [
                Rule::requiredIf(fn () => $this->input('type') === 'relation'),
                'nullable',
                'uuid',
                Rule::exists('content_types', 'id')->whereNull('deleted_at'),
            ],
            'options.label_field' => [
                Rule::requiredIf(fn () => $this->input('type') === 'relation'),
                'nullable',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    if ($this->input('type') !== 'relation') {
                        return;
                    }
                    if ($value === 'title') {
                        return;
                    }
                    $sourceTypeId = $this->input('options.source_content_type_id');
                    if (! $sourceTypeId) {
                        return;
                    }
                    $exists = CustomField::query()
                        ->where('name', $value)
                        ->whereHas('group', function ($query) use ($sourceTypeId) {
                            $query->where('target_type', 'content_type')
                                ->where('target_id', $sourceTypeId)
                                ->whereNull('deleted_at');
                        })
                        ->whereNull('deleted_at')
                        ->exists();

                    if (! $exists) {
                        $fail("The label field '{$value}' is not a valid field in the source content type.");
                    }
                },
            ],
            'options.value_field' => [
                Rule::requiredIf(fn () => $this->input('type') === 'relation'),
                'nullable',
                'string',
                'max:255',
            ],
            'options.is_multiple' => [
                'nullable',
                'boolean',
            ],
            'default_value' => ['nullable'],
            'validation_rules' => ['nullable'],
            'is_required' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => DynamicContent::normalizeFieldName((string) $this->input('name')),
            'placeholder' => $this->input('placeholder') ?: null,
            'instructions' => $this->input('instructions') ?: null,
            'is_required' => filter_var($this->input('is_required', false), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
            'is_active' => filter_var($this->input('is_active', true), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
            'sort_order' => $this->input('sort_order') !== null ? (int) $this->input('sort_order') : 0,
        ]);
    }
}
