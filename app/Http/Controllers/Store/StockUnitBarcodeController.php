<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\ProductStockUnit\BulkGenerateBarcodeRequest;
use App\Http\Requests\Store\ProductStockUnit\PrintSelectedBarcodeRequest;
use App\Models\Shop\IncomingGoods;
use App\Models\Shop\ProductStockUnit;
use App\Services\Inventory\BarcodeGeneratorService;
use App\Support\StockUnitActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class StockUnitBarcodeController extends Controller
{
    public function __construct(
        private readonly BarcodeGeneratorService $barcodeGenerator,
    ) {}

    public function generate(ProductStockUnit $productStockUnit): RedirectResponse
    {
        if ($productStockUnit->barcode) {
            return back()->with('success', 'Barcode sudah tersedia untuk stock unit ini.');
        }

        $updated = $this->barcodeGenerator->ensureBarcode($productStockUnit);

        StockUnitActivityLogger::log(
            $updated,
            'barcode_generated',
            'Barcode generated manually from stock unit page.',
        );

        return back()->with('success', 'Barcode berhasil digenerate.');
    }

    public function regenerate(ProductStockUnit $productStockUnit): RedirectResponse
    {
        if ($productStockUnit->status === 'sold') {
            return back()->with('error', 'Stock unit dengan status sold tidak boleh regenerate barcode.');
        }

        $oldBarcode = $productStockUnit->barcode;
        $updated = $this->barcodeGenerator->regenerate($productStockUnit);

        StockUnitActivityLogger::log(
            $updated,
            'barcode_regenerated',
            'Barcode regenerated manually from stock unit page.',
            $productStockUnit->status,
            $productStockUnit->status,
            [
                'old_barcode' => $oldBarcode,
                'new_barcode' => $updated->barcode,
            ],
        );

        return back()->with('success', 'Barcode berhasil diregenerate.');
    }

    public function bulkGenerate(BulkGenerateBarcodeRequest $request): RedirectResponse
    {
        $stockUnits = ProductStockUnit::query()
            ->whereIn('id', $request->validated('stock_unit_ids'))
            ->get();

        foreach ($stockUnits as $stockUnit) {
            $alreadyHadBarcode = (bool) $stockUnit->barcode;
            $updated = $this->barcodeGenerator->ensureBarcode($stockUnit);

            if (! $alreadyHadBarcode && $updated->barcode) {
                StockUnitActivityLogger::log(
                    $updated,
                    'barcode_generated',
                    'Barcode generated via bulk action.',
                );
            }
        }

        return back()->with('success', 'Bulk generate barcode berhasil diproses.');
    }

    public function print(Request $request): Response
    {
        $stockUnits = $this->resolveStockUnitsForPrint($request);

        return Inertia::render('Dashboard/Store/ProductStockUnit/BarcodePrint', [
            'stockUnits' => $this->transformForPrint($stockUnits),
            'context' => [
                'title' => 'Print Barcode Stock Units',
                'subtitle' => 'Cetak barcode unit stok berdasarkan filter/seleksi.',
                'total' => $stockUnits->count(),
            ],
        ]);
    }

    public function printSelected(PrintSelectedBarcodeRequest $request): RedirectResponse
    {
        $ids = $request->validated('stock_unit_ids');

        return redirect()->route('product-stock-units.barcodes.print', [
            'ids' => implode(',', $ids),
        ]);
    }

    public function printByIncomingGood(IncomingGoods $incomingGood): Response
    {
        $stockUnits = ProductStockUnit::query()
            ->with(['product:id,name,sku', 'variant:id,name,sku,product_id', 'variant.product:id,name,sku'])
            ->whereIn('incoming_goods_item_id', $incomingGood->items()->pluck('id'))
            ->latest()
            ->get();

        return Inertia::render('Dashboard/Store/ProductStockUnit/BarcodePrint', [
            'stockUnits' => $this->transformForPrint($stockUnits),
            'context' => [
                'title' => 'Print Barcode Incoming Goods',
                'subtitle' => 'Invoice: '.$incomingGood->invoice_number,
                'total' => $stockUnits->count(),
            ],
        ]);
    }

    private function resolveStockUnitsForPrint(Request $request): Collection
    {
        $ids = $this->extractIds($request->query('ids'));

        $query = ProductStockUnit::query()
            ->with(['product:id,name,sku', 'variant:id,name,sku,product_id', 'variant.product:id,name,sku']);

        if (! empty($ids)) {
            $query->whereIn('id', $ids);
        } else {
            $search = $request->query('search');
            $status = $request->query('status');
            $variantId = $request->query('product_variant_id');

            $query
                ->when($search, function ($builder, $value) {
                    $builder->where(function ($subQuery) use ($value) {
                        $subQuery->where('imei_serial_number', 'like', "%{$value}%")
                            ->orWhere('barcode', 'like', "%{$value}%")
                            ->orWhere('grade', 'like', "%{$value}%")
                            ->orWhereHas('product', function ($productQuery) use ($value) {
                                $productQuery->where('name', 'like', "%{$value}%")
                                    ->orWhere('sku', 'like', "%{$value}%");
                            })
                            ->orWhereHas('variant', function ($variantQuery) use ($value) {
                                $variantQuery->where('name', 'like', "%{$value}%")
                                    ->orWhere('sku', 'like', "%{$value}%");
                            });
                    });
                })
                ->when($status, fn ($builder, $value) => $builder->where('status', $value))
                ->when($variantId, fn ($builder, $value) => $builder->where('product_variant_id', $value))
                ->latest();
        }

        return $query->get();
    }

    private function transformForPrint(Collection $stockUnits): array
    {
        return $stockUnits->map(function (ProductStockUnit $stockUnit): array {
            $stockUnit = $this->barcodeGenerator->ensureBarcode($stockUnit);

            StockUnitActivityLogger::log(
                $stockUnit,
                'barcode_printed',
                'Barcode prepared for print page.',
            );

            $productName = $stockUnit->product?->name
                ?? $stockUnit->variant?->product?->name
                ?? '-';

            $sku = $stockUnit->variant?->sku
                ?? $stockUnit->product?->sku
                ?? '-';

            return [
                'id' => $stockUnit->id,
                'product_name' => $productName,
                'sku' => $sku,
                'barcode' => (string) $stockUnit->barcode,
                'barcode_svg' => $this->barcodeGenerator->generateSvg((string) $stockUnit->barcode),
                'imei_serial_number' => $stockUnit->imei_serial_number,
                'grade' => $stockUnit->grade,
                'battery_health' => $stockUnit->battery_health,
                'status' => $stockUnit->status,
            ];
        })->values()->all();
    }

    /**
     * @return array<int, string>
     */
    private function extractIds(mixed $raw): array
    {
        if (! is_string($raw) || trim($raw) === '') {
            return [];
        }

        return collect(explode(',', $raw))
            ->map(static fn (string $id) => trim($id))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
