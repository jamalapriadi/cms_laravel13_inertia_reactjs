<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class SiteContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'locale' => ['nullable', 'string', 'max:35'],
            'lang' => ['nullable', 'string', 'max:35'],
            'group' => ['nullable', 'string', 'max:255'],
            'key' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:255'],
            'format' => ['nullable', 'string', 'in:grouped,list'],
            'include_all_locales' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $locale = $this->query('locale') ?? $this->query('lang');

        $this->merge([
            'locale' => is_string($locale) && trim($locale) !== '' ? strtolower(trim($locale)) : null,
            'lang' => is_string($locale) && trim($locale) !== '' ? strtolower(trim($locale)) : null,
            'format' => $this->query('format') ? strtolower(trim($this->query('format'))) : 'grouped',
            'include_all_locales' => $this->has('include_all_locales') ? filter_var($this->query('include_all_locales'), FILTER_VALIDATE_BOOLEAN) : false,
            'page' => $this->query('page') ? (int) $this->query('page') : null,
            'per_page' => $this->query('per_page') ? (int) $this->query('per_page') : null,
        ]);
    }
}
