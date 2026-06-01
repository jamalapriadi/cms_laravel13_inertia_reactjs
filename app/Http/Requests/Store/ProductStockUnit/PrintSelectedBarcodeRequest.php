<?php

namespace App\Http\Requests\Store\ProductStockUnit;

use Illuminate\Foundation\Http\FormRequest;

class PrintSelectedBarcodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'stock_unit_ids' => ['required', 'array', 'min:1'],
            'stock_unit_ids.*' => ['required', 'uuid', 'exists:product_stock_units,id'],
        ];
    }
}
