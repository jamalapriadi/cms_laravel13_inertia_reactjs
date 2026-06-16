<?php

namespace App\Http\Requests\Store\ProductStockUnit;

use App\Models\Shop\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductStockUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'imei_serial_number' => ['nullable', 'string', 'max:255', 'unique:product_stock_units,imei_serial_number'],
            'barcode' => ['nullable', 'string', 'max:255', 'unique:product_stock_units,barcode'],
            'status' => ['nullable', 'string', Rule::in(['available', 'reserved', 'sold', 'damaged'])],
            'note' => ['nullable', 'string'],
        ];

        $productId = $this->input('product_id');

        if ($productId) {
            $product = Product::find($productId);
            if ($product) {
                if ($product->has_variant) {
                    $rules['product_variant_id'] = [
                        'required',
                        'uuid',
                        Rule::exists('variant_items', 'id')->where('product_id', $productId),
                    ];
                } else {
                    $rules['product_variant_id'] = [
                        'nullable',
                        function ($attribute, $value, $fail) {
                            if ($value !== null && $value !== '') {
                                $fail('The product variant must be empty for products without variants.');
                            }
                        },
                    ];
                }
            } else {
                $rules['product_variant_id'] = ['nullable', 'uuid', 'exists:variant_items,id'];
            }
        } else {
            $rules['product_variant_id'] = ['nullable', 'uuid', 'exists:variant_items,id'];
        }

        return $rules;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'product_variant_id' => $this->product_variant_id ?: null,
            'barcode' => $this->barcode ?: null,
            'status' => $this->status ?: 'available',
        ]);
    }
}
