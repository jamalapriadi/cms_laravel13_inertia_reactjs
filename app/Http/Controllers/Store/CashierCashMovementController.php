<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\CashierCashMovement;
use App\Models\Shop\CashierSession;
use App\Services\Cashier\CashDrawerService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CashierCashMovementController extends Controller
{
    public function __construct(private CashDrawerService $cashDrawerService) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user->hasRole(['super-admin', 'admin', 'owner']);

        if (! $user->can('cash-movements.view') && ! $user->can('cash-movements.view-all')) {
            abort(403);
        }

        $search = $request->input('search');
        $status = $request->input('status');
        $type = $request->input('type');
        $direction = $request->input('direction');
        $dateRange = $request->input('date_range');
        $cashierId = $request->input('cashier_id');

        $movements = CashierCashMovement::query()
            ->with(['cashier', 'cashierSession', 'createdBy', 'approvedBy'])
            ->when(! $isAdmin && ! $user->can('cash-movements.view-all'), function ($q) use ($user) {
                // If not admin and cannot view all, only view own movements or movements in their active session
                $q->where(function ($sub) use ($user) {
                    $sub->where('created_by', $user->id)
                        ->orWhere('cashier_id', $user->id);
                });
            })
            ->when($isAdmin && $cashierId, function ($q) use ($cashierId) {
                $q->where('cashier_id', $cashierId);
            })
            ->when($search, function ($q) use ($search) {
                $q->where('reason', 'like', "%{$search}%")
                    ->orWhere('note', 'like', "%{$search}%");
            })
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($direction, fn ($q) => $q->where('direction', $direction))
            ->when($dateRange, function ($q) use ($dateRange) {
                $dates = explode(',', $dateRange);
                if (count($dates) === 2) {
                    $q->whereBetween('created_at', [$dates[0].' 00:00:00', $dates[1].' 23:59:59']);
                }
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Dashboard/Cashier/CashMovements/Index', [
            'movements' => $movements,
            'filters' => $request->only(['search', 'status', 'type', 'direction', 'date_range', 'cashier_id']),
            'is_admin' => $isAdmin,
        ]);
    }

    public function create(Request $request)
    {
        if (! $request->user()->can('cash-movements.create')) {
            abort(403);
        }

        $user = $request->user();
        $isAdmin = $user->hasRole(['super-admin', 'admin', 'owner']);

        $activeSession = CashierSession::where('cashier_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (! $activeSession && ! $isAdmin) {
            return redirect()->route('dashboard.cashier.index')
                ->with('error', 'Silakan buka shift terlebih dahulu sebelum mencatat cash movement.');
        }

        return Inertia::render('Dashboard/Cashier/CashMovements/Create', [
            'active_session' => $activeSession,
            'is_admin' => $isAdmin,
        ]);
    }

    public function store(Request $request)
    {
        if (! $request->user()->can('cash-movements.create')) {
            abort(403);
        }

        $validated = $request->validate([
            'type' => 'required|string|in:cash_in,cash_out,adjustment,owner_withdrawal,expense',
            'direction' => 'nullable|string|in:in,out',
            'amount' => 'required|numeric|min:1',
            'reason' => 'required|string|max:1000',
            'note' => 'nullable|string|max:2000',
            'cashier_session_id' => 'nullable|exists:cashier_sessions,id',
        ]);

        // Permission check per type
        $typePermissionMap = [
            'cash_in' => 'cash-in',
            'cash_out' => 'cash-out',
            'expense' => 'expense',
            'owner_withdrawal' => 'owner-withdrawal',
            'adjustment' => 'adjustment',
        ];

        $typePerm = $typePermissionMap[$validated['type']] ?? null;
        if ($typePerm && ! $request->user()->can("cash-movements.{$typePerm}")) {
            return back()->withErrors(['error' => "Anda tidak memiliki akses untuk membuat {$validated['type']}."]);
        }

        try {
            $movement = $this->cashDrawerService->createMovement($request->user(), $validated);

            $message = 'Cash movement berhasil dicatat.';
            if ($movement->status === 'pending') {
                $message .= ' Menunggu approval.';
            }

            return redirect()->route('dashboard.cashier.cash-movements.show', $movement->id)
                ->with('success', $message);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()])->withInput();
        }
    }

    public function show(Request $request, CashierCashMovement $movement)
    {
        $user = $request->user();
        $isAdmin = $user->hasRole(['super-admin', 'admin', 'owner']);

        if (! $isAdmin && ! $user->can('cash-movements.view-all') && $movement->created_by !== $user->id && $movement->cashier_id !== $user->id) {
            abort(403);
        }

        return Inertia::render('Dashboard/Cashier/CashMovements/Show', [
            'movement' => $movement->load(['cashier', 'cashierSession', 'createdBy', 'approvedBy']),
            'can_approve' => $user->can('cash-movements.approve'),
            'can_reject' => $user->can('cash-movements.reject'),
            'can_cancel' => $user->can('cash-movements.cancel') || $user->can('cash-movements.cancel-approved') || $isAdmin,
        ]);
    }

    public function approve(Request $request, CashierCashMovement $movement)
    {
        if (! $request->user()->can('cash-movements.approve')) {
            abort(403);
        }

        $request->validate(['note' => 'nullable|string']);

        try {
            $this->cashDrawerService->approveMovement($movement, $request->user(), $request->note);

            return back()->with('success', 'Movement approved.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function reject(Request $request, CashierCashMovement $movement)
    {
        if (! $request->user()->can('cash-movements.reject')) {
            abort(403);
        }

        $request->validate(['note' => 'nullable|string']);

        try {
            $this->cashDrawerService->rejectMovement($movement, $request->user(), $request->note);

            return back()->with('success', 'Movement rejected.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function cancel(Request $request, CashierCashMovement $movement)
    {
        $request->validate(['note' => 'nullable|string']);

        try {
            $this->cashDrawerService->cancelMovement($movement, $request->user(), $request->note);

            return back()->with('success', 'Movement cancelled.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
