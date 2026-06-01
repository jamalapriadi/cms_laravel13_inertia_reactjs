<?php

namespace App\Http\Requests\Store\ProductStockUnit;

use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductStockUnitUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $stockUnit = $this->route('product_stock_unit');

        $rules = [
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'imei_serial_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('product_stock_units', 'imei_serial_number')->ignore($stockUnit?->id),
            ],
            'barcode' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('product_stock_units', 'barcode')->ignore($stockUnit?->id),
            ],
            'battery_health' => ['nullable', 'integer', 'min:0', 'max:100'],
            'grade' => ['nullable', 'string', 'max:50'],
            'network_compatibility' => ['nullable', 'string', Rule::in(ProductStockUnit::NETWORKS)],
            'status' => ['required', 'string', Rule::in(['available', 'reserved', 'sold', 'damaged'])],
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
            'network_compatibility' => $this->network_compatibility ?: null,
            'grade' => $this->grade ?: null,
        ]);
    }
}
