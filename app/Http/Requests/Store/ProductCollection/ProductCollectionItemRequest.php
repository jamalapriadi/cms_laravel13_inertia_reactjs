<?php

namespace App\Http\Requests\Store\ProductCollection;

use Illuminate\Foundation\Http\FormRequest;

class ProductCollectionItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'variant_item_id' => ['nullable', 'uuid', 'exists:variant_items,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'variant_item_id' => $this->input('variant_item_id') ?: null,
        ]);
    }
}
