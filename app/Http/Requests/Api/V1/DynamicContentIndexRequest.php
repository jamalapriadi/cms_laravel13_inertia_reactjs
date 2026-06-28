<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class DynamicContentIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', Rule::in(['published'])],
            'is_featured' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'sort' => ['nullable', 'string', Rule::in(['title', 'published_at', 'sort_order', 'created_at'])],
            'order' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
            'locale' => ['nullable', 'string', 'max:5'],
            'province' => ['nullable', 'string', 'regex:/^[a-z0-9\-]+$/'],
            'province_id' => ['nullable', 'string', 'uuid'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 422));
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_featured' => $this->input('is_featured') === null
                ? null
                : (filter_var($this->input('is_featured'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false),
        ]);
    }
}
