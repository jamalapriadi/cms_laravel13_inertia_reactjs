<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
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
            ->with(['variant.product'])
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
        $variants = ProductVariant::with('product')->get()->map(function ($v) {
            return [
                'id' => $v->id,
                'name' => $v->product->name.' - '.$v->name,
                'sku' => $v->sku,
                'stock' => $v->stock,
            ];
        });

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

    /**
     * Show the form for creating a new stock movement.
     */
    public function create(): Response
    {
        $variants = ProductVariant::with('product')->get()->map(function ($v) {
            return [
                'id' => $v->id,
                'name' => $v->product->name.' - '.$v->name,
                'sku' => $v->sku,
                'stock' => $v->stock,
            ];
        });

        return Inertia::render('Dashboard/Store/StockMovement/Create', [
            'variants' => $variants,
        ]);
    }

    /**
     * Store a newly created stock movement and adjust product variant stock.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_variant_id' => 'required|exists:product_variants,id',
            'type' => 'required|in:sale,purchase,adjustment,return,cancel',
            'qty' => 'required|integer|min:1',
            'adjustment_action' => 'nullable|in:add,subtract',
            'note' => 'nullable|string',
        ]);

        $variant = ProductVariant::findOrFail($data['product_variant_id']);

        $stockBefore = $variant->stock;
        $qty = $data['qty'];
        $type = $data['type'];

        if (in_array($type, ['purchase', 'return', 'cancel'])) {
            $stockAfter = $stockBefore + $qty;
        } elseif ($type === 'sale') {
            $stockAfter = $stockBefore - $qty;
        } else { // adjustment
            $action = $data['adjustment_action'] ?? 'add';
            if ($action === 'subtract') {
                $stockAfter = $stockBefore - $qty;
                $qty = -$qty;
            } else {
                $stockAfter = $stockBefore + $qty;
            }
        }

        // Update Variant Stock
        $variant->update(['stock' => $stockAfter]);

        // Create Movement
        StockMovement::create([
            'product_variant_id' => $data['product_variant_id'],
            'type' => $type,
            'qty' => $qty,
            'stock_before' => $stockBefore,
            'stock_after' => $stockAfter,
            'note' => $data['note'] ?? null,
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('stock-movements.index')->with('success', 'Stock movement created successfully.');
    }

    /**
     * Display details of a stock movement.
     */
    public function show(StockMovement $stockMovement): Response
    {
        return Inertia::render('Dashboard/Store/StockMovement/Show', [
            'movement' => $stockMovement->load(['variant.product']),
        ]);
    }

    /**
     * Show the form for editing a stock movement.
     */
    public function edit(StockMovement $stockMovement): Response
    {
        $variants = ProductVariant::with('product')->get()->map(function ($v) {
            return [
                'id' => $v->id,
                'name' => $v->product->name.' - '.$v->name,
                'sku' => $v->sku,
                'stock' => $v->stock,
            ];
        });

        // Determine adjustment_action parameter for adjustment movements
        $adjustmentAction = 'add';
        if ($stockMovement->type === 'adjustment' && $stockMovement->qty < 0) {
            $adjustmentAction = 'subtract';
        }

        return Inertia::render('Dashboard/Store/StockMovement/Edit', [
            'movement' => $stockMovement,
            'variants' => $variants,
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
            'type' => 'required|in:sale,purchase,adjustment,return,cancel',
            'qty' => 'required|integer|min:1',
            'adjustment_action' => 'nullable|in:add,subtract',
            'note' => 'nullable|string',
        ]);

        $variant = ProductVariant::findOrFail($data['product_variant_id']);

        // 1. Reverse the old stock movement effect
        $oldStockEffect = 0;
        $oldType = $stockMovement->type;
        $oldQty = $stockMovement->qty;

        if (in_array($oldType, ['purchase', 'return', 'cancel'])) {
            $oldStockEffect = $oldQty;
        } elseif ($oldType === 'sale') {
            $oldStockEffect = -$oldQty;
        } else { // adjustment
            $oldStockEffect = $oldQty;
        }

        // Calculate the base stock without the old movement's effect
        $baseStock = $variant->stock - $oldStockEffect;

        // 2. Calculate stock after with new updates
        $qty = $data['qty'];
        $type = $data['type'];

        if (in_array($type, ['purchase', 'return', 'cancel'])) {
            $stockAfter = $baseStock + $qty;
        } elseif ($type === 'sale') {
            $stockAfter = $baseStock - $qty;
        } else { // adjustment
            $action = $data['adjustment_action'] ?? 'add';
            if ($action === 'subtract') {
                $stockAfter = $baseStock - $qty;
                $qty = -$qty;
            } else {
                $stockAfter = $baseStock + $qty;
            }
        }

        // Update Variant Stock
        $variant->update(['stock' => $stockAfter]);

        // Update Stock Movement
        $stockMovement->update([
            'product_variant_id' => $data['product_variant_id'],
            'type' => $type,
            'qty' => $qty,
            'stock_before' => $baseStock,
            'stock_after' => $stockAfter,
            'note' => $data['note'] ?? null,
        ]);

        return redirect()->route('stock-movements.index')->with('success', 'Stock movement updated successfully.');
    }

    /**
     * Remove the stock movement and reverse stock changes.
     */
    public function destroy(StockMovement $stockMovement)
    {
        $variant = ProductVariant::findOrFail($stockMovement->product_variant_id);

        // Reverse stock changes
        $oldStockEffect = 0;
        $oldType = $stockMovement->type;
        $oldQty = $stockMovement->qty;

        if (in_array($oldType, ['purchase', 'return', 'cancel'])) {
            $oldStockEffect = $oldQty;
        } elseif ($oldType === 'sale') {
            $oldStockEffect = -$oldQty;
        } else { // adjustment
            $oldStockEffect = $oldQty;
        }

        $newStock = $variant->stock - $oldStockEffect;

        // Update stock
        $variant->update(['stock' => $newStock]);

        // Delete the movement log
        $stockMovement->delete();

        return redirect()->route('stock-movements.index')->with('success', 'Stock movement deleted successfully.');
    }
}
