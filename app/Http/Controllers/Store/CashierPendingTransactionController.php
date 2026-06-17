<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\CashierPendingTransaction;
use App\Models\Shop\CashierSession;
use App\Models\Shop\Customer;
use App\Models\Shop\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashierPendingTransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = CashierPendingTransaction::with(['cashier', 'customer', 'cashierSession'])
            ->orderBy('created_at', 'desc');

        if (! $request->user()->can('orders.view') && ! $request->user()->hasRole('super-admin')) {
            $query->where('cashier_id', $request->user()->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $pendingTransactions = $query->paginate(15)->withQueryString();

        return Inertia::render('Dashboard/Cashier/PendingTransactions/Index', [
            'pendingTransactions' => $pendingTransactions,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function show(CashierPendingTransaction $pendingTransaction)
    {
        if ($pendingTransaction->cashier_id !== request()->user()->id && ! request()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $pendingTransaction->load(['cashier', 'customer', 'cashierSession', 'items', 'convertedOrder']);

        return Inertia::render('Dashboard/Cashier/PendingTransactions/Show', [
            'pendingTransaction' => $pendingTransaction,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:2000',
            'discount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_item_id' => 'nullable|exists:variant_items,id',
            'items.*.stock_unit_id' => 'nullable|uuid',
            'items.*.qty' => 'required|integer|min:1',
        ]);

        $activeSession = CashierSession::where('cashier_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        if (! $activeSession) {
            return back()->with('error', 'Belum ada shift kasir yang aktif.');
        }

        DB::beginTransaction();
        try {
            $customer = null;
            if ($request->customer_name || $request->customer_phone) {
                $phone = $request->customer_phone ?? '00000000000';
                $customer = Customer::firstOrCreate(
                    ['phone' => $phone],
                    [
                        'name' => $request->customer_name ?? 'Customer',
                        'email' => "{$phone}@walkin.local",
                        'password' => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(16)),
                    ]
                );
            }

            $pendingTransaction = new CashierPendingTransaction();
            $pendingTransaction->cashier_session_id = $activeSession->id;
            $pendingTransaction->cashier_id = $request->user()->id;
            $pendingTransaction->customer_id = $customer ? $customer->id : null;
            $pendingTransaction->name = $request->name ?: 'Pending Transaction #' . date('Ymd-His');
            $pendingTransaction->status = 'pending';
            $pendingTransaction->discount_amount = $request->discount ?? 0;
            $pendingTransaction->note = $request->note;
            $pendingTransaction->subtotal = 0;
            $pendingTransaction->grand_total = 0;
            $pendingTransaction->save();

            $subtotal = 0;

            foreach ($request->items as $itemData) {
                $product = Product::with(['variants.items'])->findOrFail($itemData['product_id']);
                
                $unitPrice = collect([$product->base_price, $product->selling_price])->filter()->first() ?? 0;
                $variantLabel = null;
                $sku = $product->sku;

                if (!empty($itemData['variant_item_id'])) {
                    $variantItem = collect($product->variants ?? [])->flatMap(function($v) {
                        return $v->items ?? [];
                    })->where('id', $itemData['variant_item_id'])->first();
                    
                    if ($variantItem) {
                        $unitPrice = $variantItem->selling_price ?? $variantItem->price ?? $product->base_price;
                        $variantLabel = $variantItem->name;
                        $sku = $variantItem->sku ?? $product->sku;
                    }
                }

                $itemSubtotal = $unitPrice * $itemData['qty'];
                $subtotal += $itemSubtotal;

                $pendingTransaction->items()->create([
                    'product_id' => $product->id,
                    'variant_item_id' => $itemData['variant_item_id'] ?? null,
                    'stock_unit_id' => $itemData['stock_unit_id'] ?? null,
                    'name' => $product->name,
                    'variant_label' => $variantLabel,
                    'sku' => $sku,
                    'quantity' => $itemData['qty'],
                    'unit_price' => $unitPrice,
                    'subtotal' => $itemSubtotal,
                    'meta' => [
                        'thumbnail' => $product->thumbnail,
                        'stock' => $product->stock,
                    ],
                ]);
            }

            $pendingTransaction->subtotal = $subtotal;
            $pendingTransaction->grand_total = max(0, $subtotal - $pendingTransaction->discount_amount);
            $pendingTransaction->save();

            DB::commit();

            return redirect()->route('dashboard.cashier.pending-transactions.index')
                ->with('success', 'Keranjang berhasil disimpan sementara.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Terjadi kesalahan saat menyimpan cart: ' . $e->getMessage());
        }
    }

    public function resume(CashierPendingTransaction $pendingTransaction)
    {
        if ($pendingTransaction->status !== 'pending') {
            return back()->with('error', 'Transaksi ini sudah tidak pending.');
        }

        if ($pendingTransaction->cashier_id !== request()->user()->id && ! request()->user()->hasRole('super-admin')) {
            abort(403);
        }

        return redirect()->route('dashboard.cashier.orders.create', ['pending_transaction_id' => $pendingTransaction->id]);
    }

    public function cancel(CashierPendingTransaction $pendingTransaction)
    {
        if ($pendingTransaction->status !== 'pending') {
            return back()->with('error', 'Hanya transaksi pending yang bisa dibatalkan.');
        }

        if ($pendingTransaction->cashier_id !== request()->user()->id && ! request()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $pendingTransaction->status = 'cancelled';
        $pendingTransaction->save();

        return back()->with('success', 'Pending transaction dibatalkan.');
    }
}
