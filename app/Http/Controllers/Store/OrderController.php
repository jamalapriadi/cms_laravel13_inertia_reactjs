<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    /**
     * Display a listing of orders with filters and summary.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $paymentStatus = $request->input('payment_status');

        // Calculate summary counts
        $totalOrders = Order::count();
        $totalRevenue = Order::where('payment_status', 'paid')->sum('grand_total');
        $pendingOrders = Order::where('status', 'pending')->count();
        $processingOrders = Order::where('status', 'processing')->count();
        $completedOrders = Order::where('status', 'completed')->count();

        // Query orders
        $orders = Order::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%");
                });
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($paymentStatus, function ($query, $paymentStatus) {
                $query->where('payment_status', $paymentStatus);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Dashboard/Store/Order/Index', [
            'orders' => $orders,
            'summary' => [
                'total_orders' => (int) $totalOrders,
                'total_revenue' => (float) $totalRevenue,
                'pending_orders' => (int) $pendingOrders,
                'processing_orders' => (int) $processingOrders,
                'completed_orders' => (int) $completedOrders,
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
                'payment_status' => $paymentStatus,
            ],
        ]);
    }

    /**
     * Display the specified order details.
     */
    public function show(Order $order): Response
    {
        return Inertia::render('Dashboard/Store/Order/Show', [
            'order' => $order->load(['items.product', 'items.variant', 'payments']),
        ]);
    }

    /**
     * Update the order status or payment status in storage.
     */
    public function update(Request $request, Order $order): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['nullable', 'string', 'in:pending,processing,shipped,completed,cancelled'],
            'payment_status' => ['nullable', 'string', 'in:pending,paid,failed,expired,refunded'],
        ]);

        $updateData = array_filter($data, fn ($value) => $value !== null);

        if (isset($updateData['payment_status']) && $updateData['payment_status'] === 'paid' && ! $order->paid_at) {
            $updateData['paid_at'] = now();
        }

        $order->update($updateData);

        return redirect()->back()->with('success', 'Order updated successfully.');
    }

    /**
     * Remove the specified order from storage.
     */
    public function destroy(Order $order): RedirectResponse
    {
        $order->delete();

        return redirect()->route('orders.index')->with('success', 'Order deleted successfully.');
    }

    /**
     * Render receipt print view.
     */
    public function receipt(Order $order): Response
    {
        return Inertia::render('Dashboard/Store/Order/Receipt', [
            'order' => $order->load(['items.product', 'items.variant']),
        ]);
    }
}
