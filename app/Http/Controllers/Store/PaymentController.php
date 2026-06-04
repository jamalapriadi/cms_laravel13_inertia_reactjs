<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments with summary statistics and filters.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $method = $request->input('payment_method');

        $props = list_cache()->rememberRequest('payments', $request, function () use ($search, $status, $method) {
            // 1. Calculate General Summary Metrics
            $totalPayments = Payment::count();
            $totalRevenue = Payment::where('status', 'paid')->sum('amount');
            $pendingAmount = Payment::where('status', 'pending')->sum('amount');
            $refundedAmount = Payment::where('status', 'refunded')->sum('amount');

            $paidCount = Payment::where('status', 'paid')->count();
            $successRate = $totalPayments > 0 ? round(($paidCount / $totalPayments) * 100, 1) : 0.0;

            // 2. Calculate Payment Method Distribution
            $methodData = Payment::select('payment_method', DB::raw('count(*) as count'), DB::raw('sum(amount) as total'))
                ->groupBy('payment_method')
                ->orderBy('count', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'method' => $item->payment_method ?: 'Unknown',
                        'count' => (int) $item->count,
                        'total' => (float) $item->total,
                    ];
                });

            // 3. Calculate Payment Status Distribution
            $statusData = Payment::select('status', DB::raw('count(*) as count'), DB::raw('sum(amount) as total'))
                ->groupBy('status')
                ->orderBy('count', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'status' => $item->status,
                        'count' => (int) $item->count,
                        'total' => (float) $item->total,
                    ];
                });

            // 4. Query and Filter Payments
            $payments = Payment::query()
                ->with('order')
                ->when($search, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('transaction_id', 'like', "%{$search}%")
                            ->orWhereHas('order', function ($oQ) use ($search) {
                                $oQ->where('invoice_number', 'like', "%{$search}%")
                                    ->orWhere('customer_name', 'like', "%{$search}%")
                                    ->orWhere('customer_email', 'like', "%{$search}%");
                            });
                    });
                })
                ->when($status, function ($query, $status) {
                    $query->where('status', $status);
                })
                ->when($method, function ($query, $method) {
                    $query->where('payment_method', $method);
                })
                ->latest()
                ->paginate(10)
                ->withQueryString();

            return [
                'payments' => $payments,
                'summary' => [
                    'total_payments' => (int) $totalPayments,
                    'total_revenue' => (float) $totalRevenue,
                    'pending_amount' => (float) $pendingAmount,
                    'refunded_amount' => (float) $refundedAmount,
                    'success_rate' => (float) $successRate,
                    'method_distribution' => $methodData,
                    'status_distribution' => $statusData,
                ],
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'payment_method' => $method,
                ],
            ];
        });

        return Inertia::render('Dashboard/Store/Payment/Index', $props);
    }

    /**
     * Display the specified payment details.
     */
    public function show(Payment $payment): Response
    {
        return Inertia::render('Dashboard/Store/Payment/Show', [
            'payment' => $payment->load(['order.items.product', 'order.items.variant']),
        ]);
    }
}
