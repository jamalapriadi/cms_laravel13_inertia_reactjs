<?php

namespace App\Http\Requests\Store\ProductImage;

use Illuminate\Foundation\Http\FormRequest;

class ProductImageUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:4096'],
            'is_primary' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Prepare data for validation.
     */
    protected function prepareForValidation()
    {
        $this->merge([
            'is_primary' => filter_var($this->is_primary, FILTER_VALIDATE_BOOLEAN),
            'sort_order' => $this->sort_order ? (int) $this->sort_order : 0,
        ]);
    }
}
