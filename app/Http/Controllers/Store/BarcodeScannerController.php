<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\ProductStockUnit\ScanBarcodeRequest;
use App\Models\Shop\ProductStockUnit;
use App\Support\StockUnitActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class BarcodeScannerController extends Controller
{
    public function scanner(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $result = null;

        if ($search !== '') {
            $result = $this->findStockUnit($search);

            if ($result) {
                StockUnitActivityLogger::log(
                    $result,
                    'stock_scanned',
                    'Stock unit scanned from scanner page.',
                );
            }
        }

        return Inertia::render('Dashboard/Store/BarcodeScanner/Index', [
            'search' => $search,
            'stockUnit' => $result ? $this->transformStockUnit($result) : null,
        ]);
    }

    public function scanSearch(ScanBarcodeRequest $request): Response
    {
        $search = trim((string) $request->validated('search'));
        $stockUnit = $this->findStockUnit($search);

        if ($stockUnit) {
            StockUnitActivityLogger::log(
                $stockUnit,
                'stock_scanned',
                'Stock unit scanned from scanner page.',
            );
        }

        return Inertia::render('Dashboard/Store/BarcodeScanner/Index', [
            'search' => $search,
            'stockUnit' => $stockUnit ? $this->transformStockUnit($stockUnit) : null,
            'notFound' => $stockUnit === null,
        ]);
    }

    private function findStockUnit(string $search): ?ProductStockUnit
    {
        $trimmed = trim($search);

        return ProductStockUnit::query()
            ->with(['product:id,name,sku', 'variant:id,name,sku,product_id', 'variant.product:id,name,sku'])
            ->where(function ($query) use ($trimmed) {
                $query->where('barcode', $trimmed)
                    ->orWhere('imei_serial_number', $trimmed)
                    ->orWhere('id', $trimmed);

                if (Schema::hasColumn('product_stock_units', 'serial_number')) {
                    $query->orWhere('serial_number', $trimmed);
                }
            })
            ->latest()
            ->first();
    }

    private function transformStockUnit(ProductStockUnit $stockUnit): array
    {
        return [
            'id' => $stockUnit->id,
            'barcode' => $stockUnit->barcode,
            'product_name' => $stockUnit->product?->name ?? $stockUnit->variant?->product?->name ?? '-',
            'sku' => $stockUnit->variant?->sku ?? $stockUnit->product?->sku ?? '-',
            'imei_serial_number' => $stockUnit->imei_serial_number,
            'grade' => $stockUnit->grade,
            'battery_health' => $stockUnit->battery_health,
            'status' => $stockUnit->status,
            'location' => null,
            'last_activity' => $stockUnit->updated_at?->toISOString(),
            'note' => $stockUnit->note,
        ];
    }
}
