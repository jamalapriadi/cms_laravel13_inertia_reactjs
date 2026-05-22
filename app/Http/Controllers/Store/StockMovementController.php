<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\ProductVariant;
use App\Models\Shop\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockMovementController extends Controller
{
    /**
     * Display a listing of stock movements with summary metrics.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $type = $request->input('type');
        $variantId = $request->input('product_variant_id');

        // 1. Calculate General Summary Metrics (Total count, total in, total out, net change)
        $totalMovements = StockMovement::count();

        $stockIn = StockMovement::whereIn('type', ['purchase', 'return', 'cancel'])
            ->sum('qty') + StockMovement::where('type', 'adjustment')->where('qty', '>', 0)->sum('qty');

        $stockOut = StockMovement::where('type', 'sale')
            ->sum('qty') + abs(StockMovement::where('type', 'adjustment')->where('qty', '<', 0)->sum('qty'));

        $netChange = $stockIn - $stockOut;

        // 2. Calculate Type Distribution
        $typeDistribution = StockMovement::select('type', DB::raw('count(*) as count'), DB::raw('sum(qty) as total_qty'))
            ->groupBy('type')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => $item->type,
                    'count' => (int) $item->count,
                    'total_qty' => (int) $item->total_qty,
                ];
            });

        // 3. Top active product variants
        $topVariants = StockMovement::select('product_variant_id', DB::raw('count(*) as count'))
            ->groupBy('product_variant_id')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                $variant = ProductVariant::with('product')->find($item->product_variant_id);

                return [
                    'variant_id' => $item->product_variant_id,
                    'sku' => $variant?->sku ?? 'N/A',
                    'product_name' => $variant?->product?->name ?? 'Deleted Product',
                    'variant_name' => $variant?->name ?? 'Default',
                    'count' => (int) $item->count,
                ];
            });

        // 4. Query and Filter Movements
        $movements = StockMovement::query()
            ->with(['variant.product', 'stockUnit'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('note', 'like', "%{$search}%")
                        ->orWhereHas('variant', function ($vQ) use ($search) {
                            $vQ->where('sku', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%")
                                ->orWhereHas('product', function ($pQ) use ($search) {
                                    $pQ->where('name', 'like', "%{$search}%");
                                });
                        });
                });
            })
            ->when($type, function ($query, $type) {
                $query->where('type', $type);
            })
            ->when($variantId, function ($query, $variantId) {
                $query->where('product_variant_id', $variantId);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        // 5. Fetch all variants for dropdown option helper
        $variants = $this->variantOptions();

        return Inertia::render('Dashboard/Store/StockMovement/Index', [
            'movements' => $movements,
            'variants' => $variants,
            'summary' => [
                'total_movements' => (int) $totalMovements,
                'stock_in' => (int) $stockIn,
                'stock_out' => (int) $stockOut,
                'net_change' => (int) $netChange,
                'type_distribution' => $typeDistribution,
                'top_active_variants' => $topVariants,
            ],
            'filters' => [
                'search' => $search,
                'type' => $type,
                'product_variant_id' => $variantId,
            ],
        ]);
    }

    private function variantOptions()
    {
        return ProductVariant::with([
            'product',
            'stockUnits' => function ($query) {
                $query->latest();
            },
        ])
            ->withCount(['availableStockUnits'])
            ->get()
            ->map(function ($v) {
                return [
                    'id' => $v->id,
                    'name' => $v->product->name.' - '.$v->name,
                    'sku' => $v->sku,
                    'stock' => $v->available_stock_units_count,
                    'stock_units' => $v->stockUnits->map(fn ($unit) => [
                        'id' => $unit->id,
                        'imei_serial_number' => $unit->imei_serial_number,
                        'network_compatibility' => $unit->network_compatibility,
                        'status' => $unit->status,
                    ])->values(),
                ];
            });
    }

    /**
     * Show the form for creating a new stock movement.
     */
    public function create(): Response
    {
        return Inertia::render('Dashboard/Store/StockMovement/Create', [
            'variants' => $this->variantOptions(),
        ]);
    }

    /**
     * Store a newly created stock movement and adjust product variant stock.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_variant_id' => 'required|exists:product_variants,id',
            'product_stock_unit_id' => 'required|exists:product_stock_units,id',
            'type' => 'required|in:sale,purchase,adjustment,return,cancel',
            'qty' => 'nullable|integer|min:1',
            'adjustment_action' => 'nullable|in:add,subtract',
            'note' => 'nullable|string',
        ]);

        $variant = ProductVariant::findOrFail($data['product_variant_id']);
        $stockUnit = ProductStockUnit::where('product_variant_id', $variant->id)
            ->findOrFail($data['product_stock_unit_id']);

        $stockBefore = $variant->stock;
        $qty = 1;
        $type = $data['type'];
        $statusBefore = $stockUnit->status;
        $statusAfter = $this->statusAfterMovement($type, $data['adjustment_action'] ?? 'add');

        DB::transaction(function () use ($stockUnit, $variant, $statusAfter, $type, $data, $stockBefore, $statusBefore, &$qty) {
            $stockUnit->update(['status' => $statusAfter]);
            $variant->syncStockFromUnits();
            $stockAfter = $variant->fresh()->stock;

            if ($type === 'adjustment' && ($data['adjustment_action'] ?? 'add') === 'subtract') {
                $qty = -1;
            }

            StockMovement::create([
                'product_variant_id' => $data['product_variant_id'],
                'product_stock_unit_id' => $stockUnit->id,
                'type' => $type,
                'qty' => $qty,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'stock_unit_status_before' => $statusBefore,
                'stock_unit_status_after' => $statusAfter,
                'note' => $data['note'] ?? null,
                'created_by' => auth()->id(),
            ]);
        });

        return redirect()->route('stock-movements.index')->with('success', 'Stock movement created successfully.');
    }

    /**
     * Display details of a stock movement.
     */
    public function show(StockMovement $stockMovement): Response
    {
        return Inertia::render('Dashboard/Store/StockMovement/Show', [
            'movement' => $stockMovement->load(['variant.product', 'stockUnit']),
        ]);
    }

    /**
     * Show the form for editing a stock movement.
     */
    public function edit(StockMovement $stockMovement): Response
    {
        // Determine adjustment_action parameter for adjustment movements
        $adjustmentAction = 'add';
        if ($stockMovement->type === 'adjustment' && $stockMovement->qty < 0) {
            $adjustmentAction = 'subtract';
        }

        return Inertia::render('Dashboard/Store/StockMovement/Edit', [
            'movement' => $stockMovement,
            'variants' => $this->variantOptions(),
            'adjustment_action' => $adjustmentAction,
        ]);
    }

    /**
     * Update the stock movement and update the variant stock levels.
     */
    public function update(Request $request, StockMovement $stockMovement)
    {
        $data = $request->validate([
            'product_variant_id' => 'required|exists:product_variants,id',
            'product_stock_unit_id' => 'required|exists:product_stock_units,id',
            'type' => 'required|in:sale,purchase,adjustment,return,cancel',
            'qty' => 'nullable|integer|min:1',
            'adjustment_action' => 'nullable|in:add,subtract',
            'note' => 'nullable|string',
        ]);

        $variant = ProductVariant::findOrFail($data['product_variant_id']);
        $newStockUnit = ProductStockUnit::where('product_variant_id', $variant->id)
            ->findOrFail($data['product_stock_unit_id']);

        $type = $data['type'];
        $qty = 1;

        DB::transaction(function () use ($stockMovement, $newStockUnit, $variant, $data, $type, &$qty) {
            $oldStockUnit = $stockMovement->stockUnit;
            $affectedVariantIds = collect([$stockMovement->product_variant_id, $variant->id]);

            if ($oldStockUnit && $stockMovement->stock_unit_status_before) {
                $oldStockUnit->update(['status' => $stockMovement->stock_unit_status_before]);
            }

            $affectedVariantIds->unique()->each(function ($variantId) {
                ProductVariant::find($variantId)?->syncStockFromUnits();
            });

            $variant->refresh();
            $stockBefore = $variant->stock;
            $statusAfter = $this->statusAfterMovement($type, $data['adjustment_action'] ?? 'add');
            $statusBefore = $newStockUnit->fresh()->status;

            $newStockUnit->update(['status' => $statusAfter]);
            $variant->syncStockFromUnits();
            $stockAfter = $variant->fresh()->stock;

            if ($type === 'adjustment' && ($data['adjustment_action'] ?? 'add') === 'subtract') {
                $qty = -1;
            }

            $stockMovement->update([
                'product_variant_id' => $data['product_variant_id'],
                'product_stock_unit_id' => $newStockUnit->id,
                'type' => $type,
                'qty' => $qty,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'stock_unit_status_before' => $statusBefore,
                'stock_unit_status_after' => $statusAfter,
                'note' => $data['note'] ?? null,
            ]);
        });

        return redirect()->route('stock-movements.index')->with('success', 'Stock movement updated successfully.');
    }

    /**
     * Remove the stock movement and reverse stock changes.
     */
    public function destroy(StockMovement $stockMovement)
    {
        DB::transaction(function () use ($stockMovement) {
            $variantId = $stockMovement->product_variant_id;

            if ($stockMovement->stockUnit && $stockMovement->stock_unit_status_before) {
                $stockMovement->stockUnit->update([
                    'status' => $stockMovement->stock_unit_status_before,
                ]);
            }

            $stockMovement->delete();

            ProductVariant::find($variantId)?->syncStockFromUnits();
        });

        return redirect()->route('stock-movements.index')->with('success', 'Stock movement deleted successfully.');
    }

    private function statusAfterMovement(string $type, string $adjustmentAction = 'add'): string
    {
        return match ($type) {
            'sale' => 'sold',
            'purchase', 'return', 'cancel' => 'available',
            'adjustment' => $adjustmentAction === 'subtract' ? 'damaged' : 'available',
        };
    }
}
