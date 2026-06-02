<?php

namespace App\Http\Requests\Dashboard\SiteContent;

use App\Models\Shop\SiteContent;
use App\Services\ActiveLanguageService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SiteContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $siteContent = $this->route('siteContent');
        $siteContentId = $siteContent instanceof SiteContent ? $siteContent->id : $siteContent;

        return [
            'key' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9_.-]+$/',
                Rule::unique('site_contents', 'key')->ignore($siteContentId),
            ],
            'group' => ['nullable', 'string', 'max:100'],
            'type' => ['required', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'translations' => ['required', 'array'],
            'translations.*.locale' => [
                'required',
                'string',
                'max:10',
                'distinct',
                Rule::in($this->activeLocaleCodes()),
            ],
            'translations.*.value' => ['nullable', 'string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $translations = $this->normalizeTranslations($this->input('translations', []));

        $this->merge([
            'group' => $this->input('group') ?: null,
            'is_active' => filter_var($this->input('is_active', true), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
            'sort_order' => $this->input('sort_order') !== null ? (int) $this->input('sort_order') : 0,
            'translations' => $translations,
        ]);
    }

    /**
     * @return list<array{locale:string, value:mixed}>
     */
    private function normalizeTranslations(mixed $translations): array
    {
        if (! is_array($translations)) {
            return [];
        }

        if (array_is_list($translations)) {
            return collect($translations)
                ->filter(fn ($item) => is_array($item) && isset($item['locale']))
                ->map(fn (array $item) => [
                    'locale' => strtolower((string) ($item['locale'] ?? '')),
                    'value' => $item['value'] ?? null,
                ])
                ->values()
                ->all();
        }

        return collect($translations)
            ->map(fn ($value, $locale) => [
                'locale' => strtolower((string) $locale),
                'value' => is_array($value) ? ($value['value'] ?? null) : $value,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    private function activeLocaleCodes(): array
    {
        return app(ActiveLanguageService::class)->activeCodes();
    }
}
