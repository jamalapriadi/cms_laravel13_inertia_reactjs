<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Shop\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $customer = $request->user('customer');

        $summary = $customer->orders()
            ->selectRaw('COUNT(*) as total_orders')
            ->selectRaw("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders")
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders")
            ->first();

        $orders = $customer->orders()
            ->select([
                'id',
                'invoice_number',
                'status',
                'payment_status',
                'grand_total',
                'created_at',
            ])
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Customer/Dashboard/Index', [
            'customer' => [
                'id' => $customer->getKey(),
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'last_login_at' => $customer->last_login_at?->toIso8601String(),
                'member_since' => $customer->created_at?->toIso8601String(),
            ],
            'orders' => $orders->map(fn (Order $order) => [
                'id' => $order->getKey(),
                'invoice_number' => $order->invoice_number,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'grand_total' => $order->grand_total,
                'created_at' => $order->created_at?->toIso8601String(),
            ])->all(),
            'summary' => [
                'total_orders' => (int) ($summary?->total_orders ?? 0),
                'pending_orders' => (int) ($summary?->pending_orders ?? 0),
                'completed_orders' => (int) ($summary?->completed_orders ?? 0),
                'active_carts' => $customer->carts()->whereNull('checked_out_at')->count(),
            ],
        ]);
    }
}
