<?php

namespace App\Http\Requests\Store\Product;

use App\Models\Shop\VariantItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductUpdateRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'uuid', 'exists:categories,id'],
            'brand_id' => ['nullable', 'uuid', 'exists:brands,id'],
            'unit_id' => ['nullable', 'string', 'exists:units,id'],
            'thumbnail' => $this->hasFile('thumbnail')
                ? ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:2048']
                : ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'short_description' => ['nullable', 'string'],
            'condition' => ['nullable', 'string', 'in:new,like_new,second'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'length' => ['nullable', 'numeric', 'min:0'],
            'width' => ['nullable', 'numeric', 'min:0'],
            'height' => ['nullable', 'numeric', 'min:0'],
            'product_type' => ['required', 'string', 'in:simple,variable'],
            'status' => ['required', 'string', 'in:draft,active,inactive,archived'],
            'visibility' => ['required', 'string', 'in:visible,hidden'],
            'is_featured' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
            'sku' => array_filter([
                $this->boolean('has_variant') ? 'nullable' : 'required',
                'string',
                'max:255',
                Rule::unique('products', 'sku')->ignore($this->route('product')?->id),
                function ($attribute, $value, $fail) {
                    if ($value && VariantItem::where('sku', $value)->exists()) {
                        $fail('The SKU has already been used by a variant item.');
                    }
                },
            ]),
            'has_variant' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'is_publish' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        $this->merge([
            'has_variant' => filter_var($this->has_variant, FILTER_VALIDATE_BOOLEAN),
            'is_publish' => filter_var($this->is_publish, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
            'sku' => $this->input('sku') !== '' ? $this->input('sku') : null,
            'product_type' => $this->input('product_type') ?: 'simple',
            'status' => $this->input('status') ?: 'active',
            'visibility' => $this->input('visibility') ?: 'visible',
            'is_featured' => filter_var($this->is_featured, FILTER_VALIDATE_BOOLEAN),
            'sort_order' => $this->filled('sort_order') ? (int) $this->sort_order : 0,
        ]);
    }
}
