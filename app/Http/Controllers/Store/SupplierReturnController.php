<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\SupplierReturn\SupplierReturnRequest;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\StockMovement;
use App\Models\Shop\Supplier;
use App\Models\Shop\SupplierReturn;
use App\Models\Shop\SupplierReturnItem;
use App\Models\Shop\VariantItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SupplierReturnController extends Controller
{
    /**
     * Display a listing of returns.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');

        $props = list_cache()->rememberRequest('supplier-returns', $request, function () use ($search, $status) {
            $returns = SupplierReturn::query()
                ->with(['supplier', 'creator'])
                ->withCount('items')
                ->when($search, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('return_number', 'like', "%{$search}%")
                            ->orWhereHas('supplier', function ($sq) use ($search) {
                                $sq->where('name', 'like', "%{$search}%");
                            });
                    });
                })
                ->when($status, function ($query, $status) {
                    $query->where('status', $status);
                })
                ->latest()
                ->paginate(10)
                ->withQueryString();

            return [
                'returns' => $returns,
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                ],
            ];
        });

        return Inertia::render('Dashboard/Store/SupplierReturn/Index', $props);
    }

    /**
     * Show the form for creating a new return.
     */
    public function create(): Response
    {
        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get();

        $stockUnits = ProductStockUnit::with(['variant.product'])
            ->where('status', 'available')
            ->get()
            ->map(fn ($unit) => [
                'id' => $unit->id,
                'imei_serial_number' => $unit->imei_serial_number,
                'network_compatibility' => $unit->network_compatibility,
                'product_name' => $unit->variant?->product?->name ?? 'N/A',
                'variant_name' => $unit->variant?->name ?? 'N/A',
                'sku' => $unit->variant?->sku ?? 'N/A',
            ]);

        return Inertia::render('Dashboard/Store/SupplierReturn/Create', [
            'suppliers' => $suppliers,
            'stockUnits' => $stockUnits,
        ]);
    }

    /**
     * Store a newly created return.
     */
    public function store(SupplierReturnRequest $request)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data) {
            $supplier = Supplier::findOrFail($data['supplier_id']);

            $returnTrans = SupplierReturn::create([
                'supplier_id' => $data['supplier_id'],
                'return_number' => $data['return_number'],
                'return_date' => $data['return_date'],
                'note' => $data['note'] ?? null,
                'status' => $data['status'] ?? 'pending',
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            foreach ($data['items'] as $itemData) {
                SupplierReturnItem::create([
                    'supplier_return_id' => $returnTrans->id,
                    'product_stock_unit_id' => $itemData['product_stock_unit_id'],
                    'notes' => $itemData['notes'] ?? null,
                ]);

                $stockUnit = ProductStockUnit::findOrFail($itemData['product_stock_unit_id']);
                $variant = VariantItem::findOrFail($stockUnit->product_variant_id);

                $statusBefore = $stockUnit->status;

                // Quarantine/reserve on pending, mark as damaged on completed
                $newStatus = ($returnTrans->status === 'completed') ? 'damaged' : 'reserved';

                $stockBefore = $variant->stock;
                $stockUnit->update(['status' => $newStatus]);
                $variant->syncStockFromUnits();
                $stockAfter = $variant->fresh()->stock;

                if ($returnTrans->status === 'completed') {
                    StockMovement::create([
                        'product_variant_id' => $variant->id,
                        'product_stock_unit_id' => $stockUnit->id,
                        'type' => 'adjustment',
                        'qty' => -1,
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockAfter,
                        'stock_unit_status_before' => $statusBefore,
                        'stock_unit_status_after' => 'damaged',
                        'note' => "Retur barang rusak ke supplier: {$supplier->name} (No. Retur: {$returnTrans->return_number})",
                        'created_by' => auth()->id(),
                    ]);
                }
            }
        });

        return redirect()->route('supplier-returns.index')->with('success', 'Transaksi retur berhasil disimpan.');
    }

    /**
     * Display the specified return details.
     */
    public function show(SupplierReturn $supplierReturn): Response
    {
        $supplierReturn->load(['supplier', 'creator', 'items.stockUnit.variant.product']);

        return Inertia::render('Dashboard/Store/SupplierReturn/Show', [
            'supplierReturn' => $supplierReturn,
        ]);
    }

    /**
     * Show the form for editing the specified return.
     */
    public function edit(SupplierReturn $supplierReturn)
    {
        if ($supplierReturn->status !== 'pending') {
            return redirect()->route('supplier-returns.show', $supplierReturn->id)
                ->with('error', 'Transaksi retur yang sudah selesai atau dibatalkan tidak dapat diedit.');
        }

        $supplierReturn->load(['items.stockUnit.variant.product']);

        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get();

        // Active stock units + the ones currently in this return transaction
        $currentReturnUnitIds = $supplierReturn->items->pluck('product_stock_unit_id')->toArray();

        $stockUnits = ProductStockUnit::with(['variant.product'])
            ->where(function ($query) use ($currentReturnUnitIds) {
                $query->where('status', 'available')
                    ->orWhereIn('id', $currentReturnUnitIds);
            })
            ->get()
            ->map(fn ($unit) => [
                'id' => $unit->id,
                'imei_serial_number' => $unit->imei_serial_number,
                'network_compatibility' => $unit->network_compatibility,
                'product_name' => $unit->variant?->product?->name ?? 'N/A',
                'variant_name' => $unit->variant?->name ?? 'N/A',
                'sku' => $unit->variant?->sku ?? 'N/A',
            ]);

        return Inertia::render('Dashboard/Store/SupplierReturn/Edit', [
            'supplierReturn' => $supplierReturn,
            'suppliers' => $suppliers,
            'stockUnits' => $stockUnits,
        ]);
    }

    /**
     * Update the specified return.
     */
    public function update(SupplierReturnRequest $request, SupplierReturn $supplierReturn)
    {
        if ($supplierReturn->status !== 'pending') {
            return redirect()->route('supplier-returns.show', $supplierReturn->id)
                ->with('error', 'Transaksi retur yang sudah selesai atau dibatalkan tidak dapat diedit.');
        }

        $data = $request->validated();

        DB::transaction(function () use ($data, $supplierReturn) {
            $supplier = Supplier::findOrFail($data['supplier_id']);

            // 1. Revert old return items back to available
            foreach ($supplierReturn->items as $oldItem) {
                $unit = ProductStockUnit::find($oldItem->product_stock_unit_id);
                if ($unit) {
                    $unit->update(['status' => 'available']);
                    $unit->variant?->syncStockFromUnits();
                }
                $oldItem->delete();
            }

            // 2. Update return header
            $supplierReturn->update([
                'supplier_id' => $data['supplier_id'],
                'return_number' => $data['return_number'],
                'return_date' => $data['return_date'],
                'note' => $data['note'] ?? null,
                'status' => $data['status'] ?? 'pending',
                'updated_by' => auth()->id(),
            ]);

            // 3. Save new items and apply new statuses
            foreach ($data['items'] as $itemData) {
                SupplierReturnItem::create([
                    'supplier_return_id' => $supplierReturn->id,
                    'product_stock_unit_id' => $itemData['product_stock_unit_id'],
                    'notes' => $itemData['notes'] ?? null,
                ]);

                $stockUnit = ProductStockUnit::findOrFail($itemData['product_stock_unit_id']);
                $variant = VariantItem::findOrFail($stockUnit->product_variant_id);

                $statusBefore = 'available'; // Since we reverted them back to available in step 1
                $newStatus = ($supplierReturn->status === 'completed') ? 'damaged' : 'reserved';

                $stockBefore = $variant->stock;
                $stockUnit->update(['status' => $newStatus]);
                $variant->syncStockFromUnits();
                $stockAfter = $variant->fresh()->stock;

                if ($supplierReturn->status === 'completed') {
                    StockMovement::create([
                        'product_variant_id' => $variant->id,
                        'product_stock_unit_id' => $stockUnit->id,
                        'type' => 'adjustment',
                        'qty' => -1,
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockAfter,
                        'stock_unit_status_before' => $statusBefore,
                        'stock_unit_status_after' => 'damaged',
                        'note' => "Retur barang rusak ke supplier: {$supplier->name} (No. Retur: {$supplierReturn->return_number})",
                        'created_by' => auth()->id(),
                    ]);
                }
            }
        });

        return redirect()->route('supplier-returns.index')->with('success', 'Transaksi retur berhasil diperbarui.');
    }

    /**
     * Remove the specified return.
     */
    public function destroy(SupplierReturn $supplierReturn)
    {
        if ($supplierReturn->status === 'completed') {
            return redirect()->back()->with('error', 'Transaksi retur yang sudah selesai tidak dapat dihapus.');
        }

        DB::transaction(function () use ($supplierReturn) {
            // Revert return items to available before deleting
            foreach ($supplierReturn->items as $item) {
                $unit = ProductStockUnit::find($item->product_stock_unit_id);
                if ($unit) {
                    $unit->update(['status' => 'available']);
                    $unit->variant?->syncStockFromUnits();
                }
                $item->delete();
            }
            $supplierReturn->delete();
        });

        return redirect()->route('supplier-returns.index')->with('success', 'Transaksi retur berhasil dihapus.');
    }
}
