<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\IncomingGoods\IncomingGoodsRequest;
use App\Models\Shop\IncomingGoods;
use App\Models\Shop\IncomingGoodsItem;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\ProductVariant;
use App\Models\Shop\StockMovement;
use App\Models\Shop\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class IncomingGoodsController extends Controller
{
    /**
     * Display a listing of incoming goods.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');

        $incomingGoods = IncomingGoods::query()
            ->with(['supplier', 'creator'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
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

        return Inertia::render('Dashboard/Store/IncomingGoods/Index', [
            'incomingGoods' => $incomingGoods,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Show the form for creating a new incoming goods transaction.
     */
    public function create(): Response
    {
        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get();

        $variants = ProductVariant::with('product')
            ->where('is_active', true)
            ->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->product->name.' - '.$v->name,
                'sku' => $v->sku,
                'cost_price' => $v->cost_price ?? 0,
                'product_id' => $v->product_id,
            ]);

        return Inertia::render('Dashboard/Store/IncomingGoods/Create', [
            'suppliers' => $suppliers,
            'variants' => $variants,
            'networks' => ProductStockUnit::NETWORKS,
        ]);
    }

    /**
     * Store a newly created incoming goods transaction.
     */
    public function store(IncomingGoodsRequest $request)
    {
        $data = $request->validated();

        $incomingGoods = DB::transaction(function () use ($data) {
            $supplier = Supplier::findOrFail($data['supplier_id']);

            $incoming = IncomingGoods::create([
                'supplier_id' => $data['supplier_id'],
                'invoice_number' => $data['invoice_number'],
                'transaction_date' => $data['transaction_date'],
                'note' => $data['note'] ?? null,
                'status' => $data['status'] ?? 'pending',
                'total_amount' => 0, // calculated below
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            $totalAmount = 0;

            foreach ($data['items'] as $itemData) {
                $subtotal = $itemData['qty'] * $itemData['cost_price'];
                $totalAmount += $subtotal;

                $incomingItem = IncomingGoodsItem::create([
                    'incoming_goods_id' => $incoming->id,
                    'product_id' => $itemData['product_id'],
                    'product_variant_id' => $itemData['product_variant_id'],
                    'qty' => $itemData['qty'],
                    'cost_price' => $itemData['cost_price'],
                    'subtotal' => $subtotal,
                ]);

                // Create stock units
                $unitStatus = ($incoming->status === 'completed') ? 'available' : 'reserved';

                foreach ($itemData['stock_units'] as $unitData) {
                    $variant = ProductVariant::findOrFail($itemData['product_variant_id']);
                    $stockBefore = $variant->stock;

                    $stockUnit = ProductStockUnit::create([
                        'product_variant_id' => $itemData['product_variant_id'],
                        'incoming_goods_item_id' => $incomingItem->id,
                        'imei_serial_number' => $unitData['imei_serial_number'],
                        'network_compatibility' => $unitData['network_compatibility'] ?? 'sim_free',
                        'status' => $unitStatus,
                        'note' => "Pembelian dari supplier: {$supplier->name}, Invoice: {$incoming->invoice_number}",
                    ]);

                    if ($incoming->status === 'completed') {
                        $variant->syncStockFromUnits();
                        $stockAfter = $variant->fresh()->stock;

                        StockMovement::create([
                            'product_variant_id' => $variant->id,
                            'product_stock_unit_id' => $stockUnit->id,
                            'type' => 'purchase',
                            'qty' => 1,
                            'stock_before' => $stockBefore,
                            'stock_after' => $stockAfter,
                            'stock_unit_status_before' => null,
                            'stock_unit_status_after' => 'available',
                            'note' => "Pembelian (Barang Masuk) Invoice: {$incoming->invoice_number}",
                            'created_by' => auth()->id(),
                        ]);
                    }
                }
            }

            $incoming->update(['total_amount' => $totalAmount]);

            return $incoming;
        });

        return redirect()->route('incoming-goods.index')->with('success', 'Barang masuk berhasil disimpan.');
    }

    /**
     * Display the specified incoming goods transaction.
     */
    public function show(IncomingGoods $incomingGood): Response
    {
        $incomingGood->load(['supplier', 'creator', 'items.product', 'items.variant', 'items.stockUnits']);

        return Inertia::render('Dashboard/Store/IncomingGoods/Show', [
            'incomingGoods' => $incomingGood,
        ]);
    }

    /**
     * Show the form for editing the specified incoming goods transaction.
     */
    public function edit(IncomingGoods $incomingGood): Response
    {
        // Locked if completed/cancelled
        if ($incomingGood->status !== 'pending') {
            return redirect()->route('incoming-goods.show', $incomingGood->id)
                ->with('error', 'Transaksi yang sudah selesai atau dibatalkan tidak dapat diedit.');
        }

        $incomingGood->load(['items.stockUnits']);

        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get();

        $variants = ProductVariant::with('product')
            ->where('is_active', true)
            ->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->product->name.' - '.$v->name,
                'sku' => $v->sku,
                'cost_price' => $v->cost_price ?? 0,
                'product_id' => $v->product_id,
            ]);

        return Inertia::render('Dashboard/Store/IncomingGoods/Edit', [
            'incomingGoods' => $incomingGood,
            'suppliers' => $suppliers,
            'variants' => $variants,
            'networks' => ProductStockUnit::NETWORKS,
        ]);
    }

    /**
     * Update the specified incoming goods transaction.
     */
    public function update(IncomingGoodsRequest $request, IncomingGoods $incomingGood)
    {
        if ($incomingGood->status !== 'pending') {
            return redirect()->route('incoming-goods.show', $incomingGood->id)
                ->with('error', 'Transaksi yang sudah selesai atau dibatalkan tidak dapat diedit.');
        }

        $data = $request->validated();

        DB::transaction(function () use ($data, $incomingGood) {
            $supplier = Supplier::findOrFail($data['supplier_id']);

            // 1. Delete old stock units and items (since they were pending, they didn't affect stock counts or movements)
            foreach ($incomingGood->items as $oldItem) {
                ProductStockUnit::where('incoming_goods_item_id', $oldItem->id)->forceDelete();
                $oldItem->delete();
            }

            // 2. Update incoming good header
            $incomingGood->update([
                'supplier_id' => $data['supplier_id'],
                'invoice_number' => $data['invoice_number'],
                'transaction_date' => $data['transaction_date'],
                'note' => $data['note'] ?? null,
                'status' => $data['status'] ?? 'pending',
                'updated_by' => auth()->id(),
            ]);

            $totalAmount = 0;

            // 3. Create new items and stock units
            foreach ($data['items'] as $itemData) {
                $subtotal = $itemData['qty'] * $itemData['cost_price'];
                $totalAmount += $subtotal;

                $incomingItem = IncomingGoodsItem::create([
                    'incoming_goods_id' => $incomingGood->id,
                    'product_id' => $itemData['product_id'],
                    'product_variant_id' => $itemData['product_variant_id'],
                    'qty' => $itemData['qty'],
                    'cost_price' => $itemData['cost_price'],
                    'subtotal' => $subtotal,
                ]);

                $unitStatus = ($incomingGood->status === 'completed') ? 'available' : 'reserved';

                foreach ($itemData['stock_units'] as $unitData) {
                    $variant = ProductVariant::findOrFail($itemData['product_variant_id']);
                    $stockBefore = $variant->stock;

                    $stockUnit = ProductStockUnit::create([
                        'product_variant_id' => $itemData['product_variant_id'],
                        'incoming_goods_item_id' => $incomingItem->id,
                        'imei_serial_number' => $unitData['imei_serial_number'],
                        'network_compatibility' => $unitData['network_compatibility'] ?? 'sim_free',
                        'status' => $unitStatus,
                        'note' => "Pembelian dari supplier: {$supplier->name}, Invoice: {$incomingGood->invoice_number}",
                    ]);

                    if ($incomingGood->status === 'completed') {
                        $variant->syncStockFromUnits();
                        $stockAfter = $variant->fresh()->stock;

                        StockMovement::create([
                            'product_variant_id' => $variant->id,
                            'product_stock_unit_id' => $stockUnit->id,
                            'type' => 'purchase',
                            'qty' => 1,
                            'stock_before' => $stockBefore,
                            'stock_after' => $stockAfter,
                            'stock_unit_status_before' => null,
                            'stock_unit_status_after' => 'available',
                            'note' => "Pembelian (Barang Masuk) Invoice: {$incomingGood->invoice_number}",
                            'created_by' => auth()->id(),
                        ]);
                    }
                }
            }

            $incomingGood->update(['total_amount' => $totalAmount]);
        });

        return redirect()->route('incoming-goods.index')->with('success', 'Barang masuk berhasil diperbarui.');
    }

    /**
     * Remove the specified incoming goods transaction.
     */
    public function destroy(IncomingGoods $incomingGood)
    {
        if ($incomingGood->status === 'completed') {
            return redirect()->back()->with('error', 'Transaksi yang sudah selesai tidak dapat dihapus.');
        }

        DB::transaction(function () use ($incomingGood) {
            foreach ($incomingGood->items as $item) {
                // Delete associated stock units
                ProductStockUnit::where('incoming_goods_item_id', $item->id)->forceDelete();
                $item->delete();
            }
            $incomingGood->delete();
        });

        return redirect()->route('incoming-goods.index')->with('success', 'Transaksi barang masuk berhasil dihapus.');
    }
}
