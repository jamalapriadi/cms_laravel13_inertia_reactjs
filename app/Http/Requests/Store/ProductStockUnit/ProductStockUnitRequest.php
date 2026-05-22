<?php

namespace App\Http\Requests\Store\ProductStockUnit;

use App\Models\Shop\ProductStockUnit;
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
        return [
            'product_variant_id' => ['required', 'uuid', 'exists:product_variants,id'],
            'imei_serial_number' => ['required', 'string', 'max:255', 'unique:product_stock_units,imei_serial_number'],
            'network_compatibility' => ['nullable', 'string', Rule::in(ProductStockUnit::NETWORKS)],
            'status' => ['nullable', 'string', Rule::in(['available', 'reserved', 'sold', 'damaged'])],
            'note' => ['nullable', 'string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'network_compatibility' => $this->network_compatibility ?: null,
            'status' => $this->status ?: 'available',
        ]);
    }
}
