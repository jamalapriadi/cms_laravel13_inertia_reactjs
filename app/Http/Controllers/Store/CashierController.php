<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\CashierSession;
use App\Models\Shop\Customer;
use App\Models\Shop\Order;
use App\Models\Shop\Payment;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\VariantItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashierController extends Controller
{
    public function index()
    {
        $today = now()->startOfDay();
        $thisMonth = now()->startOfMonth();

        $activeSession = CashierSession::where('cashier_id', auth()->id())
            ->where('status', 'open')
            ->first();

        // recalculate current session summary if active
        $sessionSummary = null;
        if ($activeSession) {
            $sessionOrders = Order::where('cashier_session_id', $activeSession->id)->where('status', 'completed')->get();
            $cashSales = $sessionOrders->where('payment_method', 'cash')->sum('grand_total');
            $nonCashSales = $sessionOrders->where('payment_method', '!=', 'cash')->sum('grand_total');

            $sessionSummary = [
                'opened_at' => $activeSession->opened_at,
                'opening_cash' => $activeSession->opening_cash,
                'cash_sales' => $cashSales,
                'non_cash_sales' => $nonCashSales,
                'total_sales' => $sessionOrders->sum('grand_total'),
            ];
        }

        $todayOrders = Order::where('order_source', 'cashier')->where('created_at', '>=', $today)->count();
        $todayRevenue = Order::where('order_source', 'cashier')->where('created_at', '>=', $today)->where('payment_status', 'paid')->sum('grand_total');

        $monthOrders = Order::where('order_source', 'cashier')->where('created_at', '>=', $thisMonth)->count();
        $monthRevenue = Order::where('order_source', 'cashier')->where('created_at', '>=', $thisMonth)->where('payment_status', 'paid')->sum('grand_total');

        $recentOrders = Order::where('order_source', 'cashier')
            ->with(['cashier'])
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Dashboard/Cashier/Index', [
            'summary' => [
                'today_orders' => $todayOrders,
                'today_revenue' => (float) $todayRevenue,
                'month_orders' => $monthOrders,
                'month_revenue' => (float) $monthRevenue,
            ],
            'recent_orders' => $recentOrders,
            'active_session' => $activeSession,
            'session_summary' => $sessionSummary,
        ]);
    }

    public function orders(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $paymentStatus = $request->input('payment_status');
        $dateRange = $request->input('date_range');

        $orders = Order::query()
            ->where('order_source', 'cashier')
            ->with(['customer', 'cashier'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_phone', 'like', "%{$search}%");
                });
            })
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($paymentStatus, fn ($q) => $q->where('payment_status', $paymentStatus))
            ->when($dateRange, function ($q) use ($dateRange) {
                $dates = explode(',', $dateRange);
                if (count($dates) === 2) {
                    $q->whereBetween('created_at', [$dates[0].' 00:00:00', $dates[1].' 23:59:59']);
                }
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Dashboard/Cashier/Orders/Index', [
            'orders' => $orders,
            'filters' => $request->only(['search', 'status', 'payment_status', 'date_range']),
        ]);
    }

    public function create()
    {
        $activeSession = CashierSession::where('cashier_id', request()->user()->id)
            ->where('status', 'open')
            ->first();

        return Inertia::render('Dashboard/Cashier/Orders/Create', [
            'payment_methods' => [
                ['code' => 'cash', 'name' => 'Cash'],
                ['code' => 'bank_transfer', 'name' => 'Bank Transfer'],
                ['code' => 'qris', 'name' => 'QRIS Manual'],
                ['code' => 'debit', 'name' => 'Debit'],
                ['code' => 'other', 'name' => 'Other'],
            ],
            'active_session' => $activeSession,
        ]);
    }

    public function searchProduct(Request $request)
    {
        $q = $request->input('q');

        if (! $q || strlen($q) < 2) {
            return response()->json(['data' => []]);
        }

        // Search simple products
        $simpleProducts = Product::query()
            ->with(['brand', 'category'])
            ->where('has_variant', false)
            ->where('is_publish', true)
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('sku', 'like', "%{$q}%");
            })
            ->get()
            ->map(function ($product) {
                $stock = ProductStockUnit::where('product_id', $product->id)
                    ->whereNull('product_variant_id')
                    ->where('status', 'available')
                    ->count();

                return [
                    'id' => 'p_'.$product->id,
                    'type' => 'simple_product',
                    'product_id' => $product->id,
                    'variant_item_id' => null,
                    'name' => $product->name,
                    'variant_label' => null,
                    'sku' => $product->sku,
                    'price' => (float) $product->base_price,
                    'stock' => $stock,
                    'thumbnail' => $product->thumbnail,
                    'brand' => $product->brand?->name,
                    'category' => $product->category?->name,
                ];
            });

        // Search variant items
        $variantItems = VariantItem::query()
            ->with(['product.brand', 'product.category'])
            ->whereHas('product', fn ($query) => $query->where('is_publish', true))
            ->where('is_active', true)
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('sku', 'like', "%{$q}%")
                    ->orWhereHas('product', function ($pQuery) use ($q) {
                        $pQuery->where('name', 'like', "%{$q}%");
                    });
            })
            ->get()
            ->map(function ($variant) {
                $stock = ProductStockUnit::where('product_variant_id', $variant->id)
                    ->where('status', 'available')
                    ->count();

                return [
                    'id' => 'v_'.$variant->id,
                    'type' => 'variant_item',
                    'product_id' => $variant->product_id,
                    'variant_item_id' => $variant->id,
                    'name' => $variant->product?->name,
                    'variant_label' => $variant->name,
                    'sku' => $variant->sku,
                    'price' => (float) ($variant->selling_price > 0 ? $variant->selling_price : $variant->product?->base_price),
                    'stock' => $stock,
                    'thumbnail' => $variant->image ?: $variant->product?->thumbnail,
                    'brand' => $variant->product?->brand?->name,
                    'category' => $variant->product?->category?->name,
                ];
            });

        $results = $simpleProducts->concat($variantItems)
            ->filter(fn ($item) => $item['stock'] > 0) // Optional: only show in-stock items
            ->sortBy('name')
            ->values();

        return response()->json(['data' => $results]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid',
            'items.*.variant_item_id' => 'nullable|uuid',
            'items.*.qty' => 'required|integer|min:1',
            'payment_method' => 'required|string',
            'amount_paid' => 'required|numeric|min:0',
            'change_amount' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:255',
            'payment_note' => 'nullable|string',
        ]);

        $activeSession = CashierSession::where('cashier_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        if (! $activeSession) {
            return back()->withErrors(['error' => 'Silakan buka shift terlebih dahulu sebelum membuat transaksi.']);
        }

        try {
            $order = DB::transaction(function () use ($validated, $request, $activeSession) {
                $subtotal = 0;
                $orderItems = [];

                // 1. Validate stock & calculate subtotal
                foreach ($validated['items'] as $item) {
                    $stockQuery = ProductStockUnit::where('product_id', $item['product_id'])
                        ->where('status', 'available')
                        ->lockForUpdate();

                    if ($item['variant_item_id']) {
                        $stockQuery->where('product_variant_id', $item['variant_item_id']);
                        $variant = VariantItem::with('product')->findOrFail($item['variant_item_id']);
                        $price = $variant->selling_price > 0 ? $variant->selling_price : $variant->product->base_price;
                        $productName = $variant->product->name;
                        $variantName = $variant->name;
                    } else {
                        $stockQuery->whereNull('product_variant_id');
                        $product = Product::findOrFail($item['product_id']);
                        $price = $product->base_price;
                        $productName = $product->name;
                        $variantName = null;
                    }

                    $availableStock = $stockQuery->count();

                    if ($availableStock < $item['qty']) {
                        throw new \Exception("Insufficient stock for {$productName} ".($variantName ? "({$variantName})" : ''));
                    }

                    $itemSubtotal = $price * $item['qty'];
                    $subtotal += $itemSubtotal;

                    $orderItems[] = [
                        'product_id' => $item['product_id'],
                        'product_variant_id' => $item['variant_item_id'],
                        'product_name' => $productName,
                        'variant_name' => $variantName,
                        'price' => $price,
                        'qty' => $item['qty'],
                        'subtotal' => $itemSubtotal,
                    ];
                }

                $discount = $validated['discount'] ?? 0;
                $grandTotal = $subtotal - $discount;
                if ($grandTotal < 0) {
                    $grandTotal = 0;
                }

                // 2. Create Customer if needed (or use Walk-in)
                $customerName = $validated['customer_name'] ?: 'Walk-in Customer';
                $customerPhone = $validated['customer_phone'] ?? null;
                $customerId = null;

                if ($validated['customer_name'] && $customerPhone) {
                    // Try to find existing or create dummy customer
                    $customer = Customer::firstOrCreate(
                        ['phone' => $customerPhone],
                        [
                            'name' => $customerName,
                            'email' => "{$customerPhone}@walkin.local",
                            'password' => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(16)),
                            'is_active' => true,
                        ]
                    );
                    $customerId = $customer->id;
                    $customerName = $customer->name;
                    $customerPhone = $customer->phone;
                }

                // 3. Create Order
                $invoiceNumber = 'POS-'.now()->format('Ymd').'-'.str_pad(random_int(1, 99999), 5, '0', STR_PAD_LEFT);
                while (Order::where('invoice_number', $invoiceNumber)->exists()) {
                    $invoiceNumber = 'POS-'.now()->format('Ymd').'-'.str_pad(random_int(1, 99999), 5, '0', STR_PAD_LEFT);
                }

                $order = Order::create([
                    'invoice_number' => $invoiceNumber,
                    'order_source' => 'cashier',
                    'cashier_id' => $request->user()->id,
                    'cashier_session_id' => $activeSession->id,
                    'customer_id' => $customerId,
                    'customer_name' => $customerName,
                    'customer_phone' => $customerPhone,
                    'subtotal' => $subtotal,
                    'shipping_cost' => 0,
                    'discount' => $discount,
                    'grand_total' => $grandTotal,
                    'payment_method' => $validated['payment_method'],
                    'amount_paid' => $validated['amount_paid'],
                    'change_amount' => $validated['change_amount'],
                    'payment_note' => $validated['payment_note'] ?? null,
                    'payment_status' => 'paid',
                    'status' => 'completed',
                    'paid_at' => now(),
                ]);

                // 4. Create Order Items & Reserve/Sold Stock
                foreach ($orderItems as $item) {
                    $order->items()->create($item);

                    $stockUnitsToUpdate = ProductStockUnit::where('product_id', $item['product_id'])
                        ->where('status', 'available')
                        ->when($item['product_variant_id'], fn ($q) => $q->where('product_variant_id', $item['product_variant_id']))
                        ->when(! $item['product_variant_id'], fn ($q) => $q->whereNull('product_variant_id'))
                        ->limit($item['qty'])
                        ->get();

                    foreach ($stockUnitsToUpdate as $stockUnit) {
                        $stockUnit->update([
                            'status' => 'sold',
                            'reserved_order_id' => $order->id,
                            'reserved_at' => now(),
                            'note' => trim($stockUnit->note."\nSold by POS {$order->invoice_number}"),
                        ]);
                    }
                }

                // 5. Create Payment Record
                $order->payments()->create([
                    'payment_method' => $validated['payment_method'],
                    'amount' => $grandTotal,
                    'status' => 'paid',
                    'paid_at' => now(),
                    'payload' => [
                        'source' => 'cashier',
                        'amount_paid' => $validated['amount_paid'],
                        'change_amount' => $validated['change_amount'],
                    ],
                ]);

                return $order;
            });

            return redirect()->route('dashboard.cashier.orders.show', $order->id)->with('success', 'Transaction completed successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()])->withInput();
        }
    }

    public function show(Order $order)
    {
        abort_if($order->order_source !== 'cashier', 404);

        return Inertia::render('Dashboard/Cashier/Orders/Show', [
            'order' => $order->load(['customer', 'cashier', 'items.product', 'items.variant', 'payments']),
        ]);
    }

    public function receipt(Order $order)
    {
        abort_if($order->order_source !== 'cashier', 404);

        return Inertia::render('Dashboard/Cashier/Orders/Receipt', [
            'order' => $order->load(['customer', 'cashier', 'items.product', 'items.variant']),
        ]);
    }
}
