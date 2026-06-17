<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\CashierSession;
use App\Models\Shop\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashierSessionController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $dateRange = $request->input('date_range');
        $cashierId = $request->input('cashier_id');

        $user = $request->user();
        $isAdmin = $user->hasRole(['super_admin', 'admin', 'superadmin']);

        $sessions = CashierSession::query()
            ->with('cashier')
            ->when(! $isAdmin, function ($q) use ($user) {
                $q->where('cashier_id', $user->id);
            })
            ->when($isAdmin && $cashierId, function ($q) use ($cashierId) {
                $q->where('cashier_id', $cashierId);
            })
            ->when($search, function ($q) use ($search) {
                $q->whereHas('cashier', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                });
            })
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($dateRange, function ($q) use ($dateRange) {
                $dates = explode(',', $dateRange);
                if (count($dates) === 2) {
                    $q->whereBetween('opened_at', [$dates[0].' 00:00:00', $dates[1].' 23:59:59']);
                }
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $activeSession = CashierSession::where('cashier_id', $user->id)->where('status', 'open')->first();

        return Inertia::render('Dashboard/Cashier/Sessions/Index', [
            'sessions' => $sessions,
            'active_session' => $activeSession,
            'filters' => $request->only(['search', 'status', 'date_range', 'cashier_id']),
            'is_admin' => $isAdmin,
        ]);
    }

    public function open(Request $request)
    {
        $activeSession = CashierSession::where('cashier_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        if ($activeSession) {
            return redirect()->route('dashboard.cashier.sessions.show', $activeSession->id)
                ->with('info', 'Anda sudah memiliki shift yang aktif.');
        }

        return Inertia::render('Dashboard/Cashier/Sessions/Open');
    }

    public function store(Request $request)
    {
        $request->validate([
            'opening_cash' => 'required|numeric|min:0',
            'note' => 'nullable|string',
        ]);

        $activeSession = CashierSession::where('cashier_id', $request->user()->id)
            ->where('status', 'open')
            ->exists();

        if ($activeSession) {
            return back()->withErrors(['error' => 'Anda masih memiliki shift yang terbuka. Tutup shift sebelumnya terlebih dahulu.']);
        }

        DB::transaction(function () use ($request) {
            CashierSession::create([
                'cashier_id' => $request->user()->id,
                'opened_at' => now(),
                'opening_cash' => $request->opening_cash,
                'status' => 'open',
                'note' => $request->note,
            ]);
        });

        return redirect()->route('dashboard.cashier.index')->with('success', 'Shift berhasil dibuka.');
    }

    public function show(Request $request, CashierSession $session)
    {
        $user = $request->user();
        if (! $user->hasRole(['super_admin', 'admin', 'superadmin']) && $session->cashier_id !== $user->id) {
            abort(403, 'Unauthorized access to this session.');
        }

        $session->load('cashier', 'orders.customer', 'orders.payments');

        // Calculate current totals if session is open
        if ($session->status === 'open') {
            $orders = Order::where('cashier_session_id', $session->id)->where('status', 'completed')->get();
            $cashSales = $orders->where('payment_method', 'cash')->sum('grand_total');
            $nonCashSales = $orders->where('payment_method', '!=', 'cash')->sum('grand_total');
            $totalSales = $orders->sum('grand_total');
            $totalDiscount = $orders->sum('discount');

            $session->cash_sales_total = $cashSales;
            $session->non_cash_sales_total = $nonCashSales;
            $session->total_sales = $totalSales;
            $session->total_discount = $totalDiscount;
            $session->expected_cash = $session->opening_cash + $cashSales;
        }

        return Inertia::render('Dashboard/Cashier/Sessions/Show', [
            'session' => $session,
        ]);
    }

    public function close(Request $request, CashierSession $session)
    {
        if ($session->cashier_id !== $request->user()->id) {
            abort(403, 'Anda hanya dapat menutup shift milik Anda sendiri.');
        }

        if ($session->status === 'closed') {
            return redirect()->route('dashboard.cashier.sessions.show', $session->id)->with('info', 'Shift ini sudah ditutup.');
        }

        $orders = Order::where('cashier_session_id', $session->id)->where('status', 'completed')->get();
        $cashSales = $orders->where('payment_method', 'cash')->sum('grand_total');
        $expectedCash = $session->opening_cash + $cashSales;

        return Inertia::render('Dashboard/Cashier/Sessions/Close', [
            'session' => $session,
            'summary' => [
                'opening_cash' => $session->opening_cash,
                'cash_sales' => $cashSales,
                'expected_cash' => $expectedCash,
            ],
        ]);
    }

    public function closeStore(Request $request, CashierSession $session)
    {
        if ($session->cashier_id !== $request->user()->id) {
            abort(403, 'Anda hanya dapat menutup shift milik Anda sendiri.');
        }

        if ($session->status === 'closed') {
            return redirect()->route('dashboard.cashier.sessions.show', $session->id)->with('info', 'Shift ini sudah ditutup.');
        }

        $request->validate([
            'closing_cash' => 'required|numeric|min:0',
            'closed_note' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $session) {
            // Recalculate totals
            $orders = Order::where('cashier_session_id', $session->id)->where('status', 'completed')->get();
            $cashSales = $orders->where('payment_method', 'cash')->sum('grand_total');
            $nonCashSales = $orders->where('payment_method', '!=', 'cash')->sum('grand_total');
            $totalSales = $orders->sum('grand_total');
            $totalDiscount = $orders->sum('discount');
            $expectedCash = $session->opening_cash + $cashSales;
            $difference = $request->closing_cash - $expectedCash;

            $session->update([
                'closed_at' => now(),
                'closing_cash' => $request->closing_cash,
                'expected_cash' => $expectedCash,
                'cash_sales_total' => $cashSales,
                'non_cash_sales_total' => $nonCashSales,
                'total_sales' => $totalSales,
                'total_discount' => $totalDiscount,
                'difference' => $difference,
                'status' => 'closed',
                'closed_note' => $request->closed_note,
            ]);
        });

        return redirect()->route('dashboard.cashier.sessions.show', $session->id)->with('success', 'Shift berhasil ditutup.');
    }
}
