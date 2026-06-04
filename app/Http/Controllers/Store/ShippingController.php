<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\Order;
use App\Models\Shop\Shipping;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ShippingController extends Controller
{
    /**
     * Display a listing of shippings with summary metrics.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $courier = $request->input('courier');

        $props = list_cache()->rememberRequest('shipping', $request, function () use ($search, $status, $courier) {
            // 1. Calculate General Summary Metrics
            $totalShipments = Shipping::count();
            $pendingShipments = Shipping::whereIn('status', ['pending', 'processing'])->count();
            $shippedShipments = Shipping::where('status', 'shipped')->count();
            $deliveredShipments = Shipping::where('status', 'delivered')->count();
            $totalCost = Shipping::sum('shipping_cost');

            // 2. Courier Distribution
            $courierDistribution = Shipping::select('courier', DB::raw('count(*) as count'), DB::raw('sum(shipping_cost) as total_cost'))
                ->groupBy('courier')
                ->get()
                ->map(fn ($item) => [
                    'courier' => $item->courier,
                    'count' => (int) $item->count,
                    'total_cost' => (float) $item->total_cost,
                ]);

            // 3. Status Distribution
            $statusDistribution = Shipping::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->map(fn ($item) => [
                    'status' => $item->status,
                    'count' => (int) $item->count,
                ]);

            // 4. Query Shippings
            $shippings = Shipping::query()
                ->with(['order'])
                ->when($search, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('courier', 'like', "%{$search}%")
                            ->orWhere('tracking_number', 'like', "%{$search}%")
                            ->orWhereHas('order', function ($oQ) use ($search) {
                                $oQ->where('invoice_number', 'like', "%{$search}%")
                                    ->orWhere('customer_name', 'like', "%{$search}%");
                            });
                    });
                })
                ->when($status, function ($query, $status) {
                    $query->where('status', $status);
                })
                ->when($courier, function ($query, $courier) {
                    $query->where('courier', $courier);
                })
                ->latest()
                ->paginate(10)
                ->withQueryString();

            // 5. Unique couriers list for filter dropdown
            $couriers = Shipping::distinct()->pluck('courier')->filter()->values();

            return [
                'shippings' => $shippings,
                'couriers' => $couriers,
                'summary' => [
                    'total_shipments' => $totalShipments,
                    'pending_shipments' => $pendingShipments,
                    'shipped_shipments' => $shippedShipments,
                    'delivered_shipments' => $deliveredShipments,
                    'total_cost' => (float) $totalCost,
                    'courier_distribution' => $courierDistribution,
                    'status_distribution' => $statusDistribution,
                ],
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'courier' => $courier,
                ],
            ];
        });

        return Inertia::render('Dashboard/Store/Shipping/Index', $props);
    }

    /**
     * Show the form for creating a new shipping log.
     */
    public function create(): Response
    {
        // Select orders that do not have any shipping records yet
        $orders = Order::whereDoesntHave('shipping')->latest()->get()->map(fn ($order) => [
            'id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'shipping_cost' => $order->shipping_cost,
            'shipping_address' => $order->shipping_address,
        ]);

        return Inertia::render('Dashboard/Store/Shipping/Create', [
            'orders' => $orders,
        ]);
    }

    /**
     * Store a newly created shipping log.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'order_id' => 'required|exists:orders,id|unique:shippings,order_id',
            'courier' => 'required|string|max:255',
            'tracking_number' => 'nullable|string|max:255',
            'status' => 'required|in:pending,processing,shipped,delivered,failed,returned',
            'shipping_cost' => 'required|numeric|min:0',
            'shipping_address' => 'nullable|string',
            'shipped_at' => 'nullable|date',
            'delivered_at' => 'nullable|date',
        ]);

        // Auto-assign dates based on status if not provided
        if ($data['status'] === 'shipped' && empty($data['shipped_at'])) {
            $data['shipped_at'] = now();
        } elseif ($data['status'] === 'delivered') {
            if (empty($data['shipped_at'])) {
                $data['shipped_at'] = now();
            }
            if (empty($data['delivered_at'])) {
                $data['delivered_at'] = now();
            }
        }

        // Create Shipping
        $shipping = Shipping::create($data);

        // Sync Order Status
        $this->syncOrderStatus($shipping);

        return redirect()->route('shippings.index')->with('success', 'Shipping record created successfully.');
    }

    /**
     * Display the specified shipping details.
     */
    public function show(Shipping $shipping): Response
    {
        return Inertia::render('Dashboard/Store/Shipping/Show', [
            'shipping' => $shipping->load(['order']),
        ]);
    }

    /**
     * Show the form for editing the specified shipping log.
     */
    public function edit(Shipping $shipping): Response
    {
        // Eager load order
        $shipping->load('order');

        // Fetch all available orders, plus include the currently selected order
        $orders = Order::whereDoesntHave('shipping')
            ->orWhere('id', $shipping->order_id)
            ->latest()
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'invoice_number' => $order->invoice_number,
                'customer_name' => $order->customer_name,
                'shipping_cost' => $order->shipping_cost,
                'shipping_address' => $order->shipping_address,
            ]);

        return Inertia::render('Dashboard/Store/Shipping/Edit', [
            'shipping' => $shipping,
            'orders' => $orders,
        ]);
    }

    /**
     * Update the specified shipping log.
     */
    public function update(Request $request, Shipping $shipping)
    {
        $data = $request->validate([
            'order_id' => 'required|exists:orders,id|unique:shippings,order_id,'.$shipping->id,
            'courier' => 'required|string|max:255',
            'tracking_number' => 'nullable|string|max:255',
            'status' => 'required|in:pending,processing,shipped,delivered,failed,returned',
            'shipping_cost' => 'required|numeric|min:0',
            'shipping_address' => 'nullable|string',
            'shipped_at' => 'nullable|date',
            'delivered_at' => 'nullable|date',
        ]);

        // Auto-assign dates based on status if not provided
        if ($data['status'] === 'shipped' && empty($data['shipped_at'])) {
            $data['shipped_at'] = now();
        } elseif ($data['status'] === 'delivered') {
            if (empty($data['shipped_at'])) {
                $data['shipped_at'] = $shipping->shipped_at ?? now();
            }
            if (empty($data['delivered_at'])) {
                $data['delivered_at'] = now();
            }
        }

        // Reset timestamps if status is downgraded
        if (in_array($data['status'], ['pending', 'processing'])) {
            $data['shipped_at'] = null;
            $data['delivered_at'] = null;
        } elseif ($data['status'] === 'shipped') {
            $data['delivered_at'] = null;
        }

        // Update Shipping
        $shipping->update($data);

        // Sync Order Status
        $this->syncOrderStatus($shipping);

        return redirect()->route('shippings.index')->with('success', 'Shipping record updated successfully.');
    }

    /**
     * Remove the specified shipping log.
     */
    public function destroy(Shipping $shipping)
    {
        $shipping->delete();

        return redirect()->route('shippings.index')->with('success', 'Shipping record deleted successfully.');
    }

    /**
     * Sync order status based on shipping status.
     */
    protected function syncOrderStatus(Shipping $shipping): void
    {
        $order = $shipping->order;
        if (! $order) {
            return;
        }

        $newOrderStatus = match ($shipping->status) {
            'shipped' => 'shipped',
            'delivered' => 'completed',
            'pending', 'processing' => 'processing',
            default => null, // Leave failed/returned to manual adjustment
        };

        if ($newOrderStatus && $order->status !== $newOrderStatus) {
            $order->update(['status' => $newOrderStatus]);
        }
    }
}
