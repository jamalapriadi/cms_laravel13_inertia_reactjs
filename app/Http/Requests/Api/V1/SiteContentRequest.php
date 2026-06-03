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
            'lang' => ['nullable', 'string', 'max:35'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $lang = $this->query('lang');

        $this->merge([
            'lang' => is_string($lang) && trim($lang) !== '' ? strtolower(trim($lang)) : null,
        ]);
    }
}
