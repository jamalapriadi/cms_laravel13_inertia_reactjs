<?php

namespace Jamalapriadi\DynamicContentBuilder\Support;

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

final class DynamicContent
{
    /**
     * @return list<string>
     */
    public static function fieldTypes(): array
    {
        return [
            'text',
            'textarea',
            'number',
            'select',
            'radio',
            'checkbox',
            'true_false',
            'image',
            'gallery',
            'file',
            'wysiwyg',
            'date',
            'datetime',
            'json',
            'relation',
        ];
    }

    /**
     * @return list<array{value:string,label:string}>
     */
    public static function fieldTypeOptions(): array
    {
        return [
            ['value' => 'text', 'label' => 'Text'],
            ['value' => 'textarea', 'label' => 'Textarea'],
            ['value' => 'number', 'label' => 'Number'],
            ['value' => 'select', 'label' => 'Select'],
            ['value' => 'radio', 'label' => 'Radio'],
            ['value' => 'checkbox', 'label' => 'Checkbox'],
            ['value' => 'true_false', 'label' => 'True / False'],
            ['value' => 'image', 'label' => 'Image'],
            ['value' => 'gallery', 'label' => 'Gallery'],
            ['value' => 'file', 'label' => 'File'],
            ['value' => 'wysiwyg', 'label' => 'WYSIWYG'],
            ['value' => 'date', 'label' => 'Date'],
            ['value' => 'datetime', 'label' => 'Date Time'],
            ['value' => 'json', 'label' => 'JSON'],
            ['value' => 'relation', 'label' => 'Relation (Dropdown)'],
        ];
    }

    /**
     * @return list<string>
     */
    public static function reservedFieldNames(): array
    {
        return [
            'id',
            'content_type_id',
            'title',
            'slug',
            'excerpt',
            'status',
            'published_at',
            'sort_order',
            'data',
            'created_by',
            'updated_by',
            'created_at',
            'updated_at',
            'deleted_at',
            'fields',
        ];
    }

    /**
     * @return list<string>
     */
    public static function entryStatuses(): array
    {
        return ['draft', 'published', 'archived'];
    }

    public static function supportsOptions(string $type): bool
    {
        return in_array($type, ['select', 'radio', 'checkbox'], true);
    }

    public static function isMediaType(string $type): bool
    {
        return in_array($type, ['image', 'gallery', 'file'], true);
    }

    public static function isMultipleValueType(string $type): bool
    {
        return in_array($type, ['checkbox', 'gallery'], true);
    }

    public static function normalizeFieldName(string $value): string
    {
        return Str::snake(Str::lower(trim($value)));
    }

    /**
     * @return list<array{label:string,value:string}>
     */
    public static function normalizeOptions(mixed $options): array
    {
        if (is_string($options)) {
            $lines = preg_split('/\r\n|\r|\n/', $options) ?: [];

            return self::normalizeOptions($lines);
        }

        return collect(Arr::wrap($options))
            ->map(function (mixed $item): ?array {
                if (is_string($item)) {
                    $line = trim($item);

                    if ($line === '') {
                        return null;
                    }

                    if (str_contains($line, ':')) {
                        [$label, $value] = array_map('trim', explode(':', $line, 2));

                        return [
                            'label' => $label !== '' ? $label : $value,
                            'value' => $value !== '' ? self::normalizeOptionValue($value) : self::normalizeOptionValue($label),
                        ];
                    }

                    return [
                        'label' => $line,
                        'value' => self::normalizeOptionValue($line),
                    ];
                }

                if (! is_array($item)) {
                    return null;
                }

                $label = trim((string) ($item['label'] ?? $item['name'] ?? $item['value'] ?? ''));
                $value = trim((string) ($item['value'] ?? $label));

                if ($label === '' && $value === '') {
                    return null;
                }

                return [
                    'label' => $label !== '' ? $label : $value,
                    'value' => self::normalizeOptionValue($value !== '' ? $value : $label),
                ];
            })
            ->filter()
            ->unique(fn (array $item) => $item['value'])
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    public static function normalizeValidationRules(mixed $rules): array
    {
        if (is_string($rules)) {
            $decoded = json_decode($rules, true);

            if (is_array($decoded)) {
                $rules = $decoded;
            } else {
                $rules = preg_split('/\r\n|\r|\n|,/', $rules) ?: [];
            }
        }

        return collect(Arr::wrap($rules))
            ->map(fn (mixed $rule) => trim((string) $rule))
            ->filter()
            ->values()
            ->all();
    }

    public static function normalizeOptionValue(string $value): string
    {
        $value = Str::snake(Str::lower(trim($value)));

        return $value !== '' ? $value : Str::random(8);
    }

    /**
     * @param  array<int, array{label:string,value:string}>  $options
     * @return list<string>
     */
    public static function optionValues(array $options): array
    {
        return Collection::make($options)
            ->pluck('value')
            ->filter(fn (mixed $value) => is_string($value) && $value !== '')
            ->values()
            ->all();
    }
}
