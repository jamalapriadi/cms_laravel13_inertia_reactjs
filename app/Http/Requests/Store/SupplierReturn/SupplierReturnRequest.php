<?php

namespace App\Http\Requests\Store\SupplierReturn;

use App\Models\Shop\ProductStockUnit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SupplierReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $supplierReturnId = $this->route('supplier_return')?->id ?? $this->route('supplier_return');

        return [
            'supplier_id' => ['required', 'uuid', 'exists:suppliers,id'],
            'return_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('supplier_returns', 'return_number')->ignore($supplierReturnId),
            ],
            'return_date' => ['required', 'date'],
            'note' => ['nullable', 'string'],
            'status' => ['nullable', 'string', Rule::in(['pending', 'completed', 'cancelled'])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_stock_unit_id' => [
                'required',
                'uuid',
                'exists:product_stock_units,id',
                'distinct',
                function ($attribute, $value, $fail) use ($supplierReturnId) {
                    $unit = ProductStockUnit::find($value);
                    if ($unit && $unit->status !== 'available') {
                        $inThisReturn = false;
                        if ($supplierReturnId) {
                            $inThisReturn = \DB::table('supplier_return_items')
                                ->where('supplier_return_id', $supplierReturnId)
                                ->where('product_stock_unit_id', $value)
                                ->exists();
                        }
                        if (! $inThisReturn) {
                            $fail("Stock unit {$unit->imei_serial_number} is not available for return (status: {$unit->status}).");
                        }
                    }
                },
            ],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
