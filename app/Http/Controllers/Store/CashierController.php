<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\CashierPendingTransaction;
use App\Models\Shop\CashierSession;
use App\Models\Shop\Customer;
use App\Models\Shop\Order;
use App\Models\Shop\OrderDiscountApproval;
use App\Models\Shop\Payment;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\VariantItem;
use App\Services\Cashier\CashDrawerService;
use App\Services\Cashier\PricingApprovalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
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

            $movementSummary = app(CashDrawerService::class)->calculateSessionMovementSummary($activeSession);

            $sessionSummary = [
                'opened_at' => $activeSession->opened_at,
                'opening_cash' => $activeSession->opening_cash,
                'cash_sales' => $cashSales,
                'non_cash_sales' => $nonCashSales,
                'total_sales' => $sessionOrders->sum('grand_total'),
                'movement_summary' => $movementSummary,
                'expected_cash' => $activeSession->opening_cash + $cashSales + $movementSummary['net_movement'],
                'pending_movements_count' => $activeSession->cashMovements()->where('status', 'pending')->count(),
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

        $pendingTransaction = null;
        if (request()->has('pending_transaction_id')) {
            $pendingTransaction = CashierPendingTransaction::with('items')
                ->where('id', request('pending_transaction_id'))
                ->where('status', 'pending')
                ->where('cashier_id', request()->user()->id)
                ->first();
        }

        return Inertia::render('Dashboard/Cashier/Orders/Create', [
            'payment_methods' => [
                ['code' => 'cash', 'name' => 'Cash'],
                ['code' => 'bank_transfer', 'name' => 'Bank Transfer'],
                ['code' => 'qris', 'name' => 'QRIS Manual'],
                ['code' => 'debit', 'name' => 'Debit'],
                ['code' => 'other', 'name' => 'Other'],
            ],
            'active_session' => $activeSession,
            'pending_transaction' => $pendingTransaction,
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
            'items.*.stock_unit_id' => 'nullable|uuid',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.final_unit_price' => 'nullable|numeric|min:0',
            'items.*.price_override_reason' => 'nullable|string|max:1000',
            'payment_method' => 'required|string',
            'amount_paid' => 'required|numeric|min:0',
            'change_amount' => 'required|numeric|min:0',
            'discount_type' => 'nullable|string|in:percentage,nominal',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_approval_id' => 'nullable|uuid|exists:order_discount_approvals,id',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:255',
            'payment_note' => 'nullable|string',
            'pending_transaction_id' => 'nullable|exists:cashier_pending_transactions,id',
        ]);

        $activeSession = CashierSession::where('cashier_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        if (! $activeSession) {
            return back()->withErrors(['error' => 'Silakan buka shift terlebih dahulu sebelum membuat transaksi.']);
        }

        try {
            $order = DB::transaction(function () use ($validated, $request, $activeSession) {
                // Verify pending transaction if exists
                if (! empty($validated['pending_transaction_id'])) {
                    $pendingTransaction = CashierPendingTransaction::where('id', $validated['pending_transaction_id'])
                        ->where('status', 'pending')
                        ->where('cashier_session_id', $activeSession->id)
                        ->lockForUpdate()
                        ->first();

                    if (! $pendingTransaction) {
                        throw new \Exception('Pending transaction tidak valid atau sudah diproses.');
                    }
                }

                // Calculate pricing and check approvals via service
                $pricingService = app(PricingApprovalService::class);
                $discountData = [
                    'discount_type' => $validated['discount_type'] ?? null,
                    'discount_value' => $validated['discount_value'] ?? 0,
                ];

                $pricingResult = $pricingService->calculateCartPricing($validated['items'], $discountData, $request->user());

                $approvalRecord = null;
                if ($pricingResult['requires_approval']) {
                    if (empty($validated['discount_approval_id'])) {
                        throw new \Exception($pricingResult['approval_reason'].' Silakan minta approval supervisor/admin.');
                    }

                    $approvalRecord = OrderDiscountApproval::where('id', $validated['discount_approval_id'])
                        ->where('cashier_session_id', $activeSession->id)
                        ->where('status', 'approved')
                        ->first();

                    if (! $approvalRecord) {
                        throw new \Exception('Pengajuan diskon belum disetujui, ditolak, atau tidak valid.');
                    }

                    if ($approvalRecord->discount_type !== $pricingResult['discount_type'] ||
                        (float) $approvalRecord->discount_value !== (float) $pricingResult['discount_value']) {
                        throw new \Exception('Data diskon tidak cocok dengan approval yang disetujui.');
                    }
                }

                $subtotal = $pricingResult['subtotal'];
                $discount = $pricingResult['discount_amount'];
                $grandTotal = $pricingResult['grand_total'];
                $orderItems = [];

                // 1. Validate stock
                foreach ($pricingResult['items'] as $item) {
                    $stockQuery = ProductStockUnit::where('product_id', $item['product_id'])
                        ->where('status', 'available')
                        ->lockForUpdate();

                    if (! empty($item['stock_unit_id'])) {
                        $stockQuery->where('id', $item['stock_unit_id']);
                        if ($item['qty'] > 1) {
                            throw new \Exception('Stock unit spesifik (IMEI/Serial) hanya bisa dijual dengan quantity 1.');
                        }
                    }

                    if (! empty($item['variant_item_id'])) {
                        $stockQuery->where('product_variant_id', $item['variant_item_id']);
                    } else {
                        $stockQuery->whereNull('product_variant_id');
                    }

                    $availableStock = $stockQuery->count();

                    if ($availableStock < $item['qty']) {
                        throw new \Exception("Insufficient stock for {$item['name']} ".($item['variant_label'] ? "({$item['variant_label']})" : '').(! empty($item['stock_unit_id']) ? ' [Stock Unit Not Available]' : ''));
                    }

                    $orderItems[] = $item;
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
                            'password' => Hash::make(Str::random(16)),
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
                    'item_discount_total' => 0,
                    'order_discount_total' => $discount,
                    'price_override_total' => $pricingResult['price_override_total'],
                    'discount_approval_status' => $approvalRecord ? 'approved' : 'not_required',
                    'discount_approved_by' => $approvalRecord ? $approvalRecord->approved_by : null,
                    'discount_approved_at' => $approvalRecord ? $approvalRecord->approved_at : null,
                    'discount_approval_note' => $approvalRecord ? $approvalRecord->approval_note : null,
                    'grand_total' => $grandTotal,
                    'payment_method' => $validated['payment_method'],
                    'amount_paid' => $validated['amount_paid'],
                    'change_amount' => $validated['change_amount'],
                    'payment_note' => $validated['payment_note'] ?? null,
                    'payment_status' => 'paid',
                    'status' => 'completed',
                    'paid_at' => now(),
                ]);

                // Attach order ID to approval record if it exists
                if ($approvalRecord) {
                    $approvalRecord->update(['order_id' => $order->id]);
                }

                // 4. Create Order Items & Reserve/Sold Stock
                foreach ($orderItems as $item) {
                    $order->items()->create([
                        'product_id' => $item['product_id'],
                        'product_variant_id' => $item['variant_item_id'],
                        'product_name' => $item['name'],
                        'variant_name' => $item['variant_label'],
                        'price' => $item['final_unit_price'],
                        'qty' => $item['qty'],
                        'subtotal' => $item['subtotal'],
                        'original_unit_price' => $item['original_unit_price'],
                        'final_unit_price' => $item['final_unit_price'],
                        'price_override_amount' => $item['price_override_amount'],
                        'is_price_overridden' => $item['is_price_overridden'],
                        'price_overridden_by' => $item['is_price_overridden'] ? $request->user()->id : null,
                        'price_override_reason' => $item['price_override_reason'],
                        'price_overridden_at' => $item['is_price_overridden'] ? now() : null,
                    ]);

                    $stockUnitsQuery = ProductStockUnit::where('product_id', $item['product_id'])
                        ->where('status', 'available')
                        ->limit($item['qty']);

                    if (! empty($item['stock_unit_id'])) {
                        $stockUnitsQuery->where('id', $item['stock_unit_id']);
                    } else {
                        $stockUnitsQuery->when($item['variant_item_id'], fn ($q) => $q->where('product_variant_id', $item['variant_item_id']))
                            ->when(! $item['variant_item_id'], fn ($q) => $q->whereNull('product_variant_id'));
                    }

                    $stockUnitsToUpdate = $stockUnitsQuery->get();

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

                // 6. Convert pending transaction if exists
                if (isset($pendingTransaction)) {
                    $pendingTransaction->status = 'converted';
                    $pendingTransaction->converted_order_id = $order->id;
                    $pendingTransaction->converted_at = now();
                    $pendingTransaction->save();
                }

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
