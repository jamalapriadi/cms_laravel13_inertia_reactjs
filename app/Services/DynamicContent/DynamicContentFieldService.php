<?php

namespace App\Services\DynamicContent;

use App\Models\ContentType;
use App\Models\CustomField;
use App\Models\CustomFieldGroup;
use App\Support\DynamicContent;
use App\Support\MediaPath;
use App\Support\RichTextSanitizer;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

class DynamicContentFieldService
{
    public function __construct(
        private readonly RichTextSanitizer $richTextSanitizer
    ) {}

    /**
     * @return Collection<int, CustomFieldGroup>
     */
    public function activeGroupsForContentType(ContentType $contentType): Collection
    {
        return $contentType->fieldGroups()
            ->where('is_active', true)
            ->with([
                'fields' => fn ($query) => $query
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('label'),
            ])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    /**
     * @return Collection<int, CustomField>
     */
    public function activeFieldsForContentType(ContentType $contentType): Collection
    {
        return $this->activeGroupsForContentType($contentType)
            ->flatMap(fn ($group) => $group->fields)
            ->values();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function schemaForContentType(ContentType $contentType, array $entryData = []): array
    {
        return $this->activeGroupsForContentType($contentType)
            ->map(fn ($group) => [
                'id' => $group->id,
                'name' => $group->name,
                'slug' => $group->slug,
                'description' => $group->description,
                'sort_order' => $group->sort_order,
                'fields' => $group->fields
                    ->map(fn (CustomField $field) => $this->fieldPayload(
                        $field,
                        array_key_exists($field->name, $entryData)
                            ? $entryData[$field->name]
                            : $field->default_value,
                    ))
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function fieldPayload(CustomField $field, mixed $value = null): array
    {
        return [
            'id' => $field->id,
            'custom_field_group_id' => $field->custom_field_group_id,
            'label' => $field->label,
            'name' => $field->name,
            'type' => $field->type,
            'placeholder' => $field->placeholder,
            'instructions' => $field->instructions,
            'options' => DynamicContent::normalizeOptions($field->options ?? []),
            'default_value' => $this->formValue($field, $field->default_value),
            'validation_rules' => DynamicContent::normalizeValidationRules($field->validation_rules ?? []),
            'is_required' => (bool) $field->is_required,
            'is_active' => (bool) $field->is_active,
            'sort_order' => $field->sort_order,
            'value' => $this->formValue($field, $value),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function normalizeDefinitionPayload(array $data): array
    {
        $type = (string) ($data['type'] ?? 'text');
        $defaultValue = $this->normalizeDefinitionDefaultValue($type, $data['default_value'] ?? null);

        return [
            'label' => trim((string) ($data['label'] ?? '')),
            'name' => DynamicContent::normalizeFieldName((string) ($data['name'] ?? '')),
            'type' => $type,
            'placeholder' => filled($data['placeholder'] ?? null)
                ? trim((string) $data['placeholder'])
                : null,
            'instructions' => filled($data['instructions'] ?? null)
                ? trim((string) $data['instructions'])
                : null,
            'options' => DynamicContent::supportsOptions($type)
                ? DynamicContent::normalizeOptions($data['options'] ?? [])
                : null,
            'default_value' => $defaultValue,
            'validation_rules' => DynamicContent::normalizeValidationRules($data['validation_rules'] ?? []),
            'is_required' => (bool) ($data['is_required'] ?? false),
            'is_active' => (bool) ($data['is_active'] ?? true),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ];
    }

    public function normalizeValue(CustomField $field, mixed $value): mixed
    {
        return match ($field->type) {
            'text', 'textarea', 'select', 'radio', 'date', 'datetime' => $this->normalizeTextValue($value),
            'number' => $this->normalizeNumberValue($value),
            'checkbox' => $this->normalizeArrayValues($value),
            'true_false' => filter_var($value, FILTER_VALIDATE_BOOL),
            'image', 'file' => MediaPath::normalize(is_string($value) ? $value : null, requireExists: false),
            'gallery' => $this->normalizeGalleryValues($value),
            'wysiwyg' => is_string($value)
                ? $this->richTextSanitizer->sanitize($value)
                : null,
            'json' => $this->normalizeJsonValue($value),
            default => $value,
        };
    }

    public function formValue(CustomField $field, mixed $value): mixed
    {
        if ($value === null) {
            return match ($field->type) {
                'checkbox', 'gallery' => [],
                'true_false' => false,
                default => null,
            };
        }

        return match ($field->type) {
            'checkbox', 'gallery' => Arr::wrap($value),
            'true_false' => (bool) $value,
            'json' => is_string($value) ? $value : json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            default => $value,
        };
    }

    /**
     * @return array<int, string|ValidationRule>
     */
    public function valueRules(CustomField $field): array
    {
        $rules = match ($field->type) {
            'text', 'textarea', 'wysiwyg', 'image', 'file' => ['string'],
            'number' => ['numeric'],
            'select', 'radio' => ['string'],
            'checkbox', 'gallery' => ['array'],
            'true_false' => ['boolean'],
            'date', 'datetime' => ['date'],
            'json' => ['string', 'json'],
            default => ['nullable'],
        };

        if ($field->is_required) {
            array_unshift($rules, 'required');
        } else {
            array_unshift($rules, 'nullable');
        }

        $options = DynamicContent::optionValues(DynamicContent::normalizeOptions($field->options ?? []));

        if (in_array($field->type, ['select', 'radio'], true) && $options !== []) {
            $rules[] = Rule::in($options);
        }

        if (in_array($field->type, ['checkbox', 'gallery'], true) && $field->is_required) {
            $rules[] = 'min:1';
        }

        foreach (DynamicContent::normalizeValidationRules($field->validation_rules ?? []) as $rule) {
            $rules[] = $rule;
        }

        return $rules;
    }

    /**
     * @return array<int, string|ValidationRule>
     */
    public function elementRules(CustomField $field): array
    {
        $rules = ['nullable'];

        if (in_array($field->type, ['gallery', 'image', 'file'], true)) {
            return ['nullable', 'string'];
        }

        if ($field->type === 'checkbox') {
            $options = DynamicContent::optionValues(DynamicContent::normalizeOptions($field->options ?? []));

            if ($options !== []) {
                $rules[] = Rule::in($options);
            }

            return $rules;
        }

        return $rules;
    }

    private function normalizeDefinitionDefaultValue(string $type, mixed $value): mixed
    {
        return match ($type) {
            'checkbox', 'gallery' => $this->normalizeDefinitionListValue($value),
            'true_false' => filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false,
            'number' => $this->normalizeNumberValue($value),
            'image', 'file' => MediaPath::normalize(is_string($value) ? $value : null, requireExists: false),
            'json' => $this->normalizeJsonValue($value),
            'wysiwyg' => is_string($value) ? $this->richTextSanitizer->sanitize($value) : null,
            default => $this->normalizeTextValue($value),
        };
    }

    private function normalizeTextValue(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value !== '' ? $value : null;
    }

    private function normalizeNumberValue(mixed $value): int|float|null
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (! is_numeric($value)) {
            return null;
        }

        $number = $value + 0;

        return is_float($number) && floor($number) !== $number
            ? (float) $number
            : (int) $number;
    }

    /**
     * @return list<string>
     */
    private function normalizeArrayValues(mixed $value): array
    {
        return collect(Arr::wrap($value))
            ->map(fn (mixed $item) => is_string($item) ? trim($item) : null)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    private function normalizeDefinitionListValue(mixed $value): array
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);

            if (is_array($decoded)) {
                $value = $decoded;
            } else {
                $value = preg_split('/\r\n|\r|\n|,/', $value) ?: [];
            }
        }

        return $this->normalizeArrayValues($value);
    }

    /**
     * @return list<string>
     */
    private function normalizeGalleryValues(mixed $value): array
    {
        return collect(Arr::wrap($value))
            ->map(fn (mixed $item) => is_string($item) ? MediaPath::normalize($item, requireExists: false) : null)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function normalizeJsonValue(mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_array($value)) {
            return $value;
        }

        if (is_object($value)) {
            return json_decode(json_encode($value, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);
        }

        if (! is_string($value)) {
            return $value;
        }

        $decoded = json_decode($value, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
    }
}
