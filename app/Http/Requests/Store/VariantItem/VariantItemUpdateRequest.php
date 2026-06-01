<?php

namespace App\Http\Requests\Store\VariantItem;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VariantItemUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $variantItem = $this->route('variant_item');

        return [
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'unit_id' => ['nullable', 'string', 'exists:units,id'],
            'sku' => [
                'required',
                'string',
                'max:255',
                Rule::unique('variant_items', 'sku')->ignore($variantItem?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'image' => $this->hasFile('image')
                ? ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:4096']
                : ['nullable', 'string'],
            'buying_price' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'track_stock' => ['nullable', 'boolean'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'min_stock_alert' => ['nullable', 'integer', 'min:0'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'option_ids' => ['required', 'array', 'min:1'],
            'option_ids.*' => ['uuid', Rule::exists('product_variant_options', 'id')],
        ];
    }
}
