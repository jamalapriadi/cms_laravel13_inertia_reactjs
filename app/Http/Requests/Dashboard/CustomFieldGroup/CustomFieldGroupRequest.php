<?php

namespace App\Http\Requests\Dashboard\CustomFieldGroup;

use App\Models\CustomFieldGroup;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomFieldGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $group = $this->route('customFieldGroup');
        $groupId = $group instanceof CustomFieldGroup ? $group->id : $group;
        $contentTypeId = $this->input('content_type_id');

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('custom_field_groups', 'slug')
                    ->where(fn ($query) => $query
                        ->where('target_type', 'content_type')
                        ->where('target_id', $contentTypeId))
                    ->ignore($groupId),
            ],
            'description' => ['nullable', 'string'],
            'content_type_id' => ['required', 'uuid', 'exists:content_types,id'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'slug' => filled($this->input('slug')) ? str((string) $this->input('slug'))->slug()->toString() : null,
            'description' => $this->input('description') ?: null,
            'is_active' => filter_var($this->input('is_active', true), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
            'sort_order' => $this->input('sort_order') !== null ? (int) $this->input('sort_order') : 0,
        ]);
    }
}
