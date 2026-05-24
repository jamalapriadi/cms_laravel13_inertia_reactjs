<?php

namespace App\Http\Requests\Store\IncomingGoods;

use App\Models\Shop\ProductStockUnit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IncomingGoodsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $incomingGoodsId = $this->route('incoming_good')?->id ?? $this->route('incoming_good');

        return [
            'supplier_id' => ['required', 'uuid', 'exists:suppliers,id'],
            'invoice_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('incoming_goods', 'invoice_number')->ignore($incomingGoodsId),
            ],
            'transaction_date' => ['required', 'date'],
            'note' => ['nullable', 'string'],
            'status' => ['nullable', 'string', Rule::in(['pending', 'completed', 'cancelled'])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'uuid', 'exists:products,id'],
            'items.*.product_variant_id' => ['required', 'uuid', 'exists:product_variants,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.cost_price' => ['required', 'numeric', 'min:0'],
            'items.*.stock_units' => ['required', 'array'],
            'items.*.stock_units.*.imei_serial_number' => [
                'required',
                'string',
                'max:255',
                'distinct',
                function ($attribute, $value, $fail) use ($incomingGoodsId) {
                    $exists = ProductStockUnit::where('imei_serial_number', $value)
                        ->when($incomingGoodsId, function ($query) use ($incomingGoodsId) {
                            $query->whereHas('incomingGoodsItem', function ($q) use ($incomingGoodsId) {
                                $q->where('incoming_goods_id', '!=', $incomingGoodsId);
                            });
                        })
                        ->exists();

                    if ($exists) {
                        $fail("IMEI/Serial Number {$value} has already been registered in the system.");
                    }
                },
            ],
            'items.*.stock_units.*.network_compatibility' => ['nullable', 'string', Rule::in(ProductStockUnit::NETWORKS)],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                foreach ($this->input('items', []) as $index => $item) {
                    $qty = (int) ($item['qty'] ?? 0);
                    $stockUnitCount = count($item['stock_units'] ?? []);

                    if ($qty > 0 && $stockUnitCount !== $qty) {
                        $validator->errors()->add(
                            "items.{$index}.stock_units",
                            "Jumlah IMEI/serial harus sama dengan qty ({$qty}).",
                        );
                    }
                }
            },
        ];
    }
}
