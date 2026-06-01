<?php

namespace App\Http\Requests\Store\ProductVariant;

use Illuminate\Foundation\Http\FormRequest;

class ProductVariantRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'name' => ['required_without:variants', 'string', 'max:255'],
            'options' => ['nullable', 'array'],
            'options.*' => ['required', 'string', 'max:255', 'distinct'],
            'variants' => ['nullable', 'array'],
            'variants.*.name' => ['required_with:variants', 'string', 'max:255'],
            'variants.*.options' => ['required_with:variants', 'array', 'min:1'],
            'variants.*.options.*' => ['required', 'string', 'max:255', 'distinct'],
        ];
    }
}
