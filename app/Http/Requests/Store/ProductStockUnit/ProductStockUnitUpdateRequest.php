<?php

namespace App\Http\Requests\Store\ProductStockUnit;

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

        return [
            'product_variant_id' => ['required', 'uuid', 'exists:product_variants,id'],
            'imei_serial_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('product_stock_units', 'imei_serial_number')->ignore($stockUnit?->id),
            ],
            'network_compatibility' => ['nullable', 'string', Rule::in(ProductStockUnit::NETWORKS)],
            'status' => ['required', 'string', Rule::in(['available', 'reserved', 'sold', 'damaged'])],
            'note' => ['nullable', 'string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'network_compatibility' => $this->network_compatibility ?: null,
        ]);
    }
}
