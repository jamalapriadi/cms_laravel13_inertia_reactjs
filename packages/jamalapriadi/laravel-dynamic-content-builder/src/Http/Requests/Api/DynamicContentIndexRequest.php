<?php

namespace Jamalapriadi\DynamicContentBuilder\Http\Requests\Api;

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
