<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Cashier\DailyClosingReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CashierDailyClosingReportController extends Controller
{
    protected DailyClosingReportService $reportService;

    public function __construct(DailyClosingReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    protected function getFilters(Request $request): array
    {
        $filters = $request->only([
            'date',
            'start_date',
            'end_date',
            'cashier_id',
            'cashier_session_id',
            'payment_method',
            'order_status',
            'payment_status',
        ]);

        // Default to today if no date filters are provided
        if (empty($filters['date']) && empty($filters['start_date']) && empty($filters['end_date'])) {
            $filters['date'] = now()->format('Y-m-d');
        }

        // Apply permission scoping
        $user = auth()->user();
        if (! $user->hasPermissionTo('cashier.reports.daily.view_all')) {
            // Can only view their own
            $filters['cashier_id'] = $user->id;
        }

        return $filters;
    }

    public function index(Request $request)
    {
        Gate::authorize('cashier.reports.daily.view');

        $filters = $this->getFilters($request);

        $reportData = $this->reportService->generate($filters);
        $paginatedOrders = $this->reportService->getPaginatedOrders($filters);

        // Fetch list of cashiers for filter dropdown
        $cashiers = User::permission('orders.create')->select('id', 'name')->get();

        return Inertia::render('Dashboard/Cashier/Reports/Daily', [
            'filters' => $filters,
            'summary' => $reportData['summary'],
            'paymentBreakdown' => $reportData['paymentBreakdown'],
            'cashierBreakdown' => $reportData['cashierBreakdown'],
            'sessionBreakdown' => $reportData['sessionBreakdown'],
            'productBreakdown' => $reportData['productBreakdown'],
            'refundBreakdown' => $reportData['refundBreakdown'],
            'cashMovementBreakdown' => $reportData['cashMovementBreakdown'],
            'discountBreakdown' => $reportData['discountBreakdown'],
            'priceOverrideBreakdown' => $reportData['priceOverrideBreakdown'],
            'orders' => $paginatedOrders,
            'cashiers' => $cashiers,
        ]);
    }

    public function print(Request $request)
    {
        Gate::authorize('cashier.reports.daily.view');

        $filters = $this->getFilters($request);
        $reportData = $this->reportService->generate($filters);

        return Inertia::render('Dashboard/Cashier/Reports/DailyPrint', [
            'filters' => $filters,
            'summary' => $reportData['summary'],
            'paymentBreakdown' => $reportData['paymentBreakdown'],
            'cashierBreakdown' => $reportData['cashierBreakdown'],
            'sessionBreakdown' => $reportData['sessionBreakdown'],
            'cashMovementBreakdown' => $reportData['cashMovementBreakdown'],
            'refundBreakdown' => $reportData['refundBreakdown'],
            'discountBreakdown' => $reportData['discountBreakdown'],
            'priceOverrideBreakdown' => $reportData['priceOverrideBreakdown'],
        ]);
    }

    public function export(Request $request)
    {
        Gate::authorize('cashier.reports.daily.view');

        $filters = $this->getFilters($request);
        $reportData = $this->reportService->generate($filters);

        $dateStr = ! empty($filters['date']) ? $filters['date'] : ($filters['start_date'].'-to-'.$filters['end_date']);
        $filename = "daily-closing-report-{$dateStr}.csv";

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=$filename",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($reportData) {
            $file = fopen('php://output', 'w');

            // 1. Summary
            fputcsv($file, ['DAILY CLOSING REPORT SUMMARY']);
            fputcsv($file, ['Total Orders', $reportData['summary']['total_orders']]);
            fputcsv($file, ['Gross Sales', $reportData['summary']['gross_sales']]);
            fputcsv($file, ['Total Refund', $reportData['summary']['total_refund']]);
            fputcsv($file, ['Net Sales', $reportData['summary']['net_sales']]);
            fputcsv($file, ['Total Discount', $reportData['summary']['total_discount']]);
            fputcsv($file, ['Expected Cash', $reportData['summary']['total_expected_cash']]);
            fputcsv($file, ['Closing Cash', $reportData['summary']['total_closing_cash']]);
            fputcsv($file, ['Cash Difference', $reportData['summary']['total_cash_difference']]);
            fputcsv($file, []);

            // 2. Payment Breakdown
            fputcsv($file, ['PAYMENT BREAKDOWN']);
            fputcsv($file, ['Method', 'Total Orders', 'Total Amount', 'Percentage (%)']);
            foreach ($reportData['paymentBreakdown'] as $row) {
                fputcsv($file, [$row['method'], $row['total_orders'], $row['total_amount'], $row['percentage']]);
            }
            fputcsv($file, []);

            // 3. Cashier Breakdown
            fputcsv($file, ['CASHIER BREAKDOWN']);
            fputcsv($file, ['Cashier Name', 'Orders', 'Gross Sales', 'Refunds', 'Net Sales', 'Cash Sales', 'Non-Cash Sales', 'Sessions', 'Difference']);
            foreach ($reportData['cashierBreakdown'] as $row) {
                fputcsv($file, [
                    $row['cashier_name'], $row['total_orders'], $row['gross_sales'], $row['total_refund'],
                    $row['net_sales'], $row['cash_sales'], $row['non_cash_sales'], $row['total_sessions'], $row['total_cash_difference'],
                ]);
            }
            fputcsv($file, []);

            // 4. Session Breakdown
            fputcsv($file, ['SESSION BREAKDOWN']);
            fputcsv($file, ['ID', 'Cashier', 'Opened At', 'Closed At', 'Expected Cash', 'Closing Cash', 'Difference', 'Status']);
            foreach ($reportData['sessionBreakdown'] as $row) {
                fputcsv($file, [
                    $row['id'], $row['cashier_name'], $row['opened_at'], $row['closed_at'],
                    $row['expected_cash'], $row['closing_cash'], $row['difference'], $row['status'],
                ]);
            }
            fputcsv($file, []);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
