<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Shop\OrderDiscountApproval;
use App\Services\Cashier\PricingApprovalService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CashierDiscountApprovalController extends Controller
{
    public function __construct(
        private readonly PricingApprovalService $pricingApprovalService
    ) {}

    /**
     * Display a listing of the discount approvals.
     */
    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $cashierId = $request->query('cashier_id');
        $dateRange = $request->query('date_range');
        $approvalType = $request->query('approval_type');

        $query = OrderDiscountApproval::with(['cashier', 'cashierSession', 'approvedBy']);

        // Cashiers can only view their own requests unless they have permission to manage approvals
        $canManage = $request->user()->can('cashier.discount.manage_approvals') || $request->user()->hasRole('super-admin');
        if (! $canManage) {
            $query->where('cashier_id', $request->user()->id);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($cashierId && $canManage) {
            $query->where('cashier_id', $cashierId);
        }

        if ($approvalType) {
            $query->where('approval_type', $approvalType);
        }

        if ($dateRange) {
            $dates = explode(',', $dateRange);
            if (count($dates) === 2) {
                $query->whereBetween('created_at', [$dates[0].' 00:00:00', $dates[1].' 23:59:59']);
            }
        }

        $approvals = $query->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Dashboard/Cashier/DiscountApprovals/Index', [
            'approvals' => $approvals,
            'filters' => $request->only(['status', 'cashier_id', 'date_range', 'approval_type']),
        ]);
    }

    /**
     * Store a newly created approval request.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'cashier_session_id' => 'required|exists:cashier_sessions,id',
            'approval_type' => 'required|string|in:order_discount,item_discount,price_override',
            'discount_type' => 'nullable|string|in:percentage,nominal',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_amount' => 'required|numeric|min:0',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'subtotal_before_discount' => 'required|numeric|min:0',
            'grand_total_after_discount' => 'required|numeric|min:0',
            'reason' => 'required|string|max:2000',
            'items_snapshot' => 'required|array',
            'pricing_snapshot' => 'required|array',
        ]);

        try {
            $approval = $this->pricingApprovalService->createDiscountApproval($validated, $request->user());

            return back()->with('success', 'Request approval diskon berhasil dibuat.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Display the specified discount approval details.
     */
    public function show(OrderDiscountApproval $approval): Response
    {
        $user = request()->user();
        $canManage = $user->can('cashier.discount.manage_approvals') || $user->hasRole('super-admin');

        // Cashiers can only view their own requests
        if (! $canManage && $approval->cashier_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $approval->load(['cashier', 'cashierSession', 'approvedBy', 'order']);

        return Inertia::render('Dashboard/Cashier/DiscountApprovals/Show', [
            'approval' => $approval,
        ]);
    }

    /**
     * Approve the request.
     */
    public function approve(Request $request, OrderDiscountApproval $approval)
    {
        $request->validate([
            'note' => 'nullable|string|max:1000',
        ]);

        if (! $request->user()->can('cashier.discount.approve') && ! $request->user()->hasRole('super-admin')) {
            abort(403, 'Anda tidak memiliki izin untuk menyetujui pengajuan diskon.');
        }

        try {
            $this->pricingApprovalService->approve($approval, $request->user(), $request->input('note'));

            return back()->with('success', 'Pengajuan diskon berhasil disetujui.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Reject the request.
     */
    public function reject(Request $request, OrderDiscountApproval $approval)
    {
        $request->validate([
            'note' => 'nullable|string|max:1000',
        ]);

        if (! $request->user()->can('cashier.discount.approve') && ! $request->user()->hasRole('super-admin')) {
            abort(403, 'Anda tidak memiliki izin untuk menolak pengajuan diskon.');
        }

        try {
            $this->pricingApprovalService->reject($approval, $request->user(), $request->input('note'));

            return back()->with('success', 'Pengajuan diskon ditolak.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
