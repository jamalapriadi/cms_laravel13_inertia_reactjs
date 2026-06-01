<?php

namespace App\Http\Requests\Store\VariantItem;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VariantItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'items' => ['nullable', 'array'],
            'items.*.sku' => ['required_with:items', 'string', 'max:255', 'distinct', 'unique:variant_items,sku'],
            'items.*.name' => ['required_with:items', 'string', 'max:255'],
            'items.*.image' => ['nullable', 'string'],
            'items.*.buying_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.selling_price' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.stock' => ['nullable', 'integer', 'min:0'],
            'items.*.min_stock_alert' => ['nullable', 'integer', 'min:0'],
            'items.*.weight' => ['nullable', 'numeric', 'min:0'],
            'items.*.is_active' => ['nullable', 'boolean'],
            'items.*.option_ids' => ['required_with:items', 'array', 'min:1'],
            'items.*.option_ids.*' => ['uuid', 'exists:product_variant_options,id'],
            'sku' => ['required_without:items', 'string', 'max:255', 'unique:variant_items,sku'],
            'name' => ['required_without:items', 'string', 'max:255'],
            'image' => $this->hasFile('image')
                ? ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:4096']
                : ['nullable', 'string'],
            'buying_price' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['required_without:items', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'min_stock_alert' => ['nullable', 'integer', 'min:0'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'unit_id' => ['nullable', 'string', 'exists:units,id'],
            'track_stock' => ['nullable', 'boolean'],
            'option_ids' => ['required_without:items', 'array', 'min:1'],
            'option_ids.*' => ['uuid', Rule::exists('product_variant_options', 'id')],
        ];
    }
}
