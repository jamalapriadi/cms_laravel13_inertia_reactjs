<?php

namespace Jamalapriadi\DynamicContentBuilder\Http\Requests\Dashboard;

use Jamalapriadi\DynamicContentBuilder\Models\ContentEntry;
use Jamalapriadi\DynamicContentBuilder\Models\ContentType;
use Jamalapriadi\DynamicContentBuilder\Services\DynamicContentFieldService;
use Jamalapriadi\DynamicContentBuilder\Support\DynamicContent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class ContentEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $contentType = $this->route('contentType');
        abort_unless($contentType instanceof ContentType, 404);

        $contentEntry = $this->route('contentEntry');
        $contentEntryId = $contentEntry instanceof ContentEntry ? $contentEntry->id : null;
        $fieldService = app(DynamicContentFieldService::class);

        $rules = [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('content_entries', 'slug')
                    ->where(fn ($query) => $query->where('content_type_id', $contentType->id))
                    ->ignore($contentEntryId),
            ],
            'excerpt' => ['nullable', 'string'],
            'status' => ['required', 'string', Rule::in(DynamicContent::entryStatuses())],
            'published_at' => ['nullable', 'date'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'fields' => ['nullable', 'array'],
        ];

        foreach ($fieldService->activeFieldsForContentType($contentType) as $field) {
            $rules["fields.{$field->name}"] = $fieldService->valueRules($field);

            if (DynamicContent::isMultipleValueType($field->type)) {
                $rules["fields.{$field->name}.*"] = $fieldService->elementRules($field);
            }
        }

        return $rules;
    }

    protected function prepareForValidation(): void
    {
        $contentType = $this->route('contentType');

        if (! $contentType instanceof ContentType) {
            return;
        }

        $fields = $this->input('fields', []);
        $fieldService = app(DynamicContentFieldService::class);

        if (! is_array($fields)) {
            $fields = [];
        }

        foreach ($fieldService->activeFieldsForContentType($contentType) as $field) {
            $value = $fields[$field->name] ?? null;

            if (in_array($field->type, ['checkbox', 'gallery'], true)) {
                $fields[$field->name] = collect(Arr::wrap($value))
                    ->map(fn (mixed $item) => is_string($item) ? trim($item) : $item)
                    ->filter(fn (mixed $item) => $item !== null && $item !== '')
                    ->values()
                    ->all();

                continue;
            }

            if ($field->type === 'true_false') {
                $fields[$field->name] = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;

                continue;
            }

            if ($field->type === 'json' && is_array($value)) {
                $fields[$field->name] = json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

                continue;
            }

            if (is_string($value)) {
                $fields[$field->name] = $value === '' ? null : $value;
            }
        }

        $this->merge([
            'slug' => filled($this->input('slug')) ? str((string) $this->input('slug'))->slug()->toString() : null,
            'excerpt' => $this->input('excerpt') ?: null,
            'published_at' => $this->input('published_at') ?: null,
            'sort_order' => $this->input('sort_order') !== null ? (int) $this->input('sort_order') : 0,
            'fields' => $fields,
        ]);
    }
}
