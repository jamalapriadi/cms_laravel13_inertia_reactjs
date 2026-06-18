<?php

namespace App\Services\Cashier;

use App\Models\Shop\CashierSession;
use App\Models\Shop\Order;
use App\Models\Shop\OrderDiscountApproval;
use App\Models\Shop\OrderRefund;
use Carbon\Carbon;

class DailyClosingReportService
{
    public function generate(array $filters): array
    {
        $orders = $this->getOrders($filters);
        $sessions = $this->getSessions($filters);

        return [
            'summary' => $this->calculateSummary($orders, $sessions),
            'paymentBreakdown' => $this->calculatePaymentBreakdown($orders),
            'cashierBreakdown' => $this->calculateCashierBreakdown($orders, $sessions),
            'sessionBreakdown' => $this->calculateSessionBreakdown($sessions),
            'productBreakdown' => $this->calculateProductBreakdown($orders),
            'refundBreakdown' => $this->calculateRefundBreakdown($filters),
            'cashMovementBreakdown' => $this->calculateCashMovementBreakdown($sessions),
            'discountBreakdown' => $this->calculateDiscountBreakdown($orders, $filters),
            'priceOverrideBreakdown' => $this->calculatePriceOverrideBreakdown($orders),
            'orders' => $orders,
            'sessions' => $sessions,
        ];
    }

    protected function buildDateFilter($query, array $filters, string $dateColumn)
    {
        if (! empty($filters['start_date']) && ! empty($filters['end_date'])) {
            $startDate = Carbon::parse($filters['start_date'])->startOfDay();
            $endDate = Carbon::parse($filters['end_date'])->endOfDay();
            $query->whereBetween($dateColumn, [$startDate, $endDate]);
        } elseif (! empty($filters['date'])) {
            $date = Carbon::parse($filters['date']);
            $query->whereDate($dateColumn, $date);
        } else {
            $query->whereDate($dateColumn, Carbon::today());
        }

        return $query;
    }

    protected function getOrders(array $filters)
    {
        $query = Order::with(['items.product', 'items.variant', 'customer', 'cashier', 'cashierSession', 'payments', 'refunds'])
            ->where('order_source', 'cashier'); // default filter

        $query = $this->buildDateFilter($query, $filters, 'created_at');

        if (! empty($filters['cashier_id'])) {
            $query->where('cashier_id', $filters['cashier_id']);
        }

        if (! empty($filters['cashier_session_id'])) {
            $query->where('cashier_session_id', $filters['cashier_session_id']);
        }

        if (! empty($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }

        if (! empty($filters['order_status'])) {
            $query->where('status', $filters['order_status']);
        }

        if (! empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        return $query->get();
    }

    public function getPaginatedOrders(array $filters, int $perPage = 15)
    {
        $query = Order::with(['customer', 'cashier', 'cashierSession'])
            ->where('order_source', 'cashier');

        $query = $this->buildDateFilter($query, $filters, 'created_at');

        if (! empty($filters['cashier_id'])) {
            $query->where('cashier_id', $filters['cashier_id']);
        }

        if (! empty($filters['cashier_session_id'])) {
            $query->where('cashier_session_id', $filters['cashier_session_id']);
        }

        if (! empty($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }

        if (! empty($filters['order_status'])) {
            $query->where('status', $filters['order_status']);
        }

        if (! empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();
    }

    protected function getSessions(array $filters)
    {
        $query = CashierSession::with(['cashier', 'cashMovements']);

        // Assuming session date filtering is based on opened_at
        $query = $this->buildDateFilter($query, $filters, 'opened_at');

        if (! empty($filters['cashier_id'])) {
            $query->where('cashier_id', $filters['cashier_id']);
        }

        if (! empty($filters['cashier_session_id'])) {
            $query->where('id', $filters['cashier_session_id']);
        }

        return $query->get();
    }

    protected function calculateSummary($orders, $sessions): array
    {
        $validOrders = $orders->where('status', '!=', 'cancelled');
        $totalOrders = $validOrders->count();

        $grossSales = $validOrders->sum('grand_total');
        $totalRefund = $orders->sum(function ($order) {
            return $order->refunds->where('refund_status', 'completed')->sum('refund_amount');
        });

        $netSales = $grossSales - $totalRefund;

        $totalDiscount = $validOrders->sum('discount') + $validOrders->sum('item_discount_total');
        $totalPriceOverride = $validOrders->sum('price_override_total');

        $totalCashSales = $validOrders->where('payment_method', 'cash')->sum('amount_paid');
        $totalNonCashSales = $validOrders->where('payment_method', '!=', 'cash')->sum('amount_paid'); // Adjust based on how amount_paid and change is handled, or use grand_total

        // Alternatively using grand_total for sales
        $totalCashSales = $validOrders->where('payment_method', 'cash')->sum('grand_total');
        $totalNonCashSales = $validOrders->where('payment_method', '!=', 'cash')->sum('grand_total');

        $totalExpectedCash = $sessions->sum('expected_cash');
        $totalClosingCash = $sessions->where('status', 'closed')->sum('closing_cash');
        $totalCashDifference = $sessions->where('status', 'closed')->sum('difference');

        $totalOpenSessions = $sessions->where('status', 'open')->count();
        $totalClosedSessions = $sessions->where('status', 'closed')->count();

        $totalCustomers = $validOrders->whereNotNull('customer_id')->unique('customer_id')->count();
        $averageOrderValue = $totalOrders > 0 ? $netSales / $totalOrders : 0;

        return [
            'total_orders' => $totalOrders,
            'gross_sales' => $grossSales,
            'net_sales' => $netSales,
            'total_refund' => $totalRefund,
            'total_discount' => $totalDiscount,
            'total_price_override' => $totalPriceOverride,
            'total_cash_sales' => $totalCashSales,
            'total_non_cash_sales' => $totalNonCashSales,
            'total_expected_cash' => $totalExpectedCash,
            'total_closing_cash' => $totalClosingCash,
            'total_cash_difference' => $totalCashDifference,
            'total_open_sessions' => $totalOpenSessions,
            'total_closed_sessions' => $totalClosedSessions,
            'total_customers' => $totalCustomers,
            'average_order_value' => $averageOrderValue,
        ];
    }

    protected function calculatePaymentBreakdown($orders): array
    {
        $validOrders = $orders->where('status', '!=', 'cancelled');
        $grossSales = $validOrders->sum('grand_total');

        $breakdown = [];
        $grouped = $validOrders->groupBy('payment_method');

        foreach ($grouped as $method => $methodOrders) {
            $amount = $methodOrders->sum('grand_total');
            $percentage = $grossSales > 0 ? ($amount / $grossSales) * 100 : 0;

            $breakdown[] = [
                'method' => $method ?: 'Unknown',
                'total_orders' => $methodOrders->count(),
                'total_amount' => $amount,
                'percentage' => round($percentage, 2),
            ];
        }

        // Sort by amount descending
        usort($breakdown, function ($a, $b) {
            return $b['total_amount'] <=> $a['total_amount'];
        });

        return $breakdown;
    }

    protected function calculateCashierBreakdown($orders, $sessions): array
    {
        $breakdown = [];
        $validOrders = $orders->where('status', '!=', 'cancelled');

        $cashiers = $validOrders->pluck('cashier')->unique('id')->filter();
        // Also include cashiers from sessions even if no valid orders
        $sessionCashiers = $sessions->pluck('cashier')->unique('id')->filter();
        $allCashiers = $cashiers->merge($sessionCashiers)->unique('id');

        foreach ($allCashiers as $cashier) {
            $cashierOrders = $validOrders->where('cashier_id', $cashier->id);
            $cashierSessions = $sessions->where('cashier_id', $cashier->id);

            $grossSales = $cashierOrders->sum('grand_total');
            $totalRefund = $orders->where('cashier_id', $cashier->id)->sum(function ($order) {
                return $order->refunds->where('refund_status', 'completed')->sum('refund_amount');
            });
            $netSales = $grossSales - $totalRefund;

            $breakdown[] = [
                'cashier_id' => $cashier->id,
                'cashier_name' => $cashier->name,
                'total_orders' => $cashierOrders->count(),
                'gross_sales' => $grossSales,
                'net_sales' => $netSales,
                'total_refund' => $totalRefund,
                'total_discount' => $cashierOrders->sum('discount') + $cashierOrders->sum('item_discount_total'),
                'cash_sales' => $cashierOrders->where('payment_method', 'cash')->sum('grand_total'),
                'non_cash_sales' => $cashierOrders->where('payment_method', '!=', 'cash')->sum('grand_total'),
                'total_sessions' => $cashierSessions->count(),
                'total_cash_difference' => $cashierSessions->where('status', 'closed')->sum('difference'),
            ];
        }

        return $breakdown;
    }

    protected function calculateSessionBreakdown($sessions): array
    {
        $breakdown = [];

        foreach ($sessions as $session) {
            $breakdown[] = [
                'id' => $session->id,
                'cashier_name' => $session->cashier ? $session->cashier->name : 'Unknown',
                'opened_at' => $session->opened_at ? $session->opened_at->format('Y-m-d H:i:s') : null,
                'closed_at' => $session->closed_at ? $session->closed_at->format('Y-m-d H:i:s') : null,
                'opening_cash' => $session->opening_cash,
                'cash_sales' => $session->cash_sales_total,
                'non_cash_sales' => $session->non_cash_sales_total,
                'cash_in' => $session->cash_in_total,
                'cash_out' => $session->cash_out_total,
                'expense' => $session->expense_total,
                'owner_withdrawal' => $session->owner_withdrawal_total,
                'adjustment' => $session->adjustment_total,
                'expected_cash' => $session->expected_cash,
                'closing_cash' => $session->closing_cash,
                'difference' => $session->difference,
                'status' => $session->status,
            ];
        }

        return $breakdown;
    }

    protected function calculateProductBreakdown($orders): array
    {
        $products = [];
        $validOrders = $orders->where('status', '!=', 'cancelled');

        foreach ($validOrders as $order) {
            foreach ($order->items as $item) {
                $key = $item->product_id.'_'.$item->product_variant_id;

                if (! isset($products[$key])) {
                    $products[$key] = [
                        'product_name' => $item->product_name,
                        'variant_label' => $item->variant_name,
                        'qty_sold' => 0,
                        'gross_sales' => 0,
                        'refund_qty' => 0,
                    ];
                }

                $products[$key]['qty_sold'] += $item->qty;
                $products[$key]['gross_sales'] += $item->subtotal; // Use subtotal or calculate based on final_unit_price
            }
        }

        // Subtract refunds (if tracked at item level in OrderRefundItem, otherwise approximation)
        // Since we don't have OrderRefundItem loaded easily here without extra queries,
        // we'll fetch them separately or assume they are rare.
        // For simplicity and performance, if refunds are tracked per item, query them.

        $result = [];
        foreach ($products as $p) {
            $p['net_qty'] = $p['qty_sold'] - $p['refund_qty'];
            $p['net_sales'] = $p['gross_sales']; // Adjust if refund amount per item is known
            $result[] = $p;
        }

        // Sort by net_qty descending
        usort($result, function ($a, $b) {
            return $b['net_qty'] <=> $a['net_qty'];
        });

        return array_slice($result, 0, 50); // Top 50
    }

    protected function calculateRefundBreakdown(array $filters): array
    {
        $query = OrderRefund::with('order');
        $query = $this->buildDateFilter($query, $filters, 'created_at');

        if (! empty($filters['cashier_id'])) {
            // Depending on how processed_by is set, it might be the cashier
            $query->whereHas('order', function ($q) use ($filters) {
                $q->where('cashier_id', $filters['cashier_id']);
            });
        }

        if (! empty($filters['cashier_session_id'])) {
            $query->where('cashier_session_id', $filters['cashier_session_id']);
        }

        $refunds = $query->get();
        $completedRefunds = $refunds->where('refund_status', 'completed');

        return [
            'total_refund_amount' => $completedRefunds->sum('refund_amount'),
            'total_refund_count' => $completedRefunds->count(),
            'full_refund_count' => $completedRefunds->where('type', 'full_refund')->count(),
            'partial_refund_count' => $completedRefunds->where('type', 'partial_refund')->count(),
            'cancel_order_count' => $completedRefunds->where('type', 'cancel')->count(),
            'recent_reasons' => $completedRefunds->pluck('reason')->filter()->unique()->take(5)->values()->toArray(),
        ];
    }

    protected function calculateCashMovementBreakdown($sessions): array
    {
        $movements = collect();
        foreach ($sessions as $session) {
            $movements = $movements->merge($session->cashMovements);
        }

        $approvedMovements = $movements->where('status', 'approved');

        return [
            'cash_in_total' => $approvedMovements->where('type', 'cash_in')->sum('amount'),
            'cash_out_total' => $approvedMovements->where('type', 'cash_out')->sum('amount'),
            'expense_total' => $approvedMovements->where('type', 'expense')->sum('amount'),
            'owner_withdrawal_total' => $approvedMovements->where('type', 'owner_withdrawal')->sum('amount'),
            'adjustment_in_total' => $approvedMovements->where('type', 'adjustment')->where('direction', 'in')->sum('amount'),
            'adjustment_out_total' => $approvedMovements->where('type', 'adjustment')->where('direction', 'out')->sum('amount'),
            'pending_count' => $movements->where('status', 'pending')->count(),
            'rejected_count' => $movements->where('status', 'rejected')->count(),
            'cancelled_count' => $movements->where('status', 'cancelled')->count(),
        ];
    }

    protected function calculateDiscountBreakdown($orders, array $filters): array
    {
        $validOrders = $orders->where('status', '!=', 'cancelled');

        $query = OrderDiscountApproval::query();
        $query = $this->buildDateFilter($query, $filters, 'created_at');
        if (! empty($filters['cashier_id'])) {
            $query->where('cashier_id', $filters['cashier_id']);
        }
        if (! empty($filters['cashier_session_id'])) {
            $query->where('cashier_session_id', $filters['cashier_session_id']);
        }
        $approvals = $query->get();

        return [
            'total_discount_amount' => $validOrders->sum('discount') + $validOrders->sum('item_discount_total'),
            'total_order_discount' => $validOrders->sum('discount'),
            'total_item_discount' => $validOrders->sum('item_discount_total'),
            'total_approved_discount' => $approvals->where('status', 'approved')->sum('discount_amount'),
            'pending_approval_count' => $approvals->where('status', 'pending')->count(),
            'rejected_approval_count' => $approvals->where('status', 'rejected')->count(),
            'approved_approval_count' => $approvals->where('status', 'approved')->count(),
        ];
    }

    protected function calculatePriceOverrideBreakdown($orders): array
    {
        $validOrders = $orders->where('status', '!=', 'cancelled');
        $overriddenItemsCount = 0;

        foreach ($validOrders as $order) {
            $overriddenItemsCount += $order->items->where('is_price_overridden', true)->count();
        }

        return [
            'total_orders_with_override' => $validOrders->where('price_override_total', '>', 0)->count(),
            'total_items_with_override' => $overriddenItemsCount,
            'total_override_amount' => $validOrders->sum('price_override_total'),
        ];
    }
}
