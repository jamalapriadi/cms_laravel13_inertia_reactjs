<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\Cart;
use App\Models\Shop\Customer;
use App\Models\Shop\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $status = $request->input('status');

        $props = list_cache()->rememberRequest('customers', $request, function () use ($search, $status) {
            $totalCustomers = Customer::count();
            $activeCustomers = Customer::where('is_active', true)->count();
            $disabledCustomers = Customer::where('is_active', false)->count();
            $customersWithOrders = Customer::has('orders')->count();
            $customersWithCarts = Customer::has('carts')->count();
            $totalRevenue = Order::where('payment_status', 'paid')->sum('grand_total');

            $customers = Customer::query()
                ->withCount(['orders', 'carts'])
                ->withSum(['orders as paid_revenue' => function ($query) {
                    $query->where('payment_status', 'paid');
                }], 'grand_total')
                ->when($search, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
                })
                ->when($status === 'active', fn ($query) => $query->where('is_active', true))
                ->when($status === 'disabled', fn ($query) => $query->where('is_active', false))
                ->latest()
                ->paginate(10)
                ->withQueryString();

            return [
                'customers' => $customers,
                'summary' => [
                    'total_customers' => (int) $totalCustomers,
                    'active_customers' => (int) $activeCustomers,
                    'disabled_customers' => (int) $disabledCustomers,
                    'customers_with_orders' => (int) $customersWithOrders,
                    'customers_with_carts' => (int) $customersWithCarts,
                    'total_revenue' => (float) $totalRevenue,
                ],
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                ],
            ];
        });

        return Inertia::render('Dashboard/Store/Customer/Index', $props);
    }

    public function show(Customer $customer): Response
    {
        $customer->loadCount(['orders', 'carts'])
            ->loadSum(['orders as paid_revenue' => function ($query) {
                $query->where('payment_status', 'paid');
            }], 'grand_total');

        $recentOrders = $customer->orders()
            ->latest()
            ->limit(10)
            ->get();

        $recentCarts = $customer->carts()
            ->withCount('items')
            ->latest('updated_at')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard/Store/Customer/Show', [
            'customer' => $customer,
            'recentOrders' => $recentOrders,
            'recentCarts' => $recentCarts,
            'activity' => [
                'paid_orders' => (int) $customer->orders()->where('payment_status', 'paid')->count(),
                'pending_orders' => (int) $customer->orders()->where('status', 'pending')->count(),
                'completed_orders' => (int) $customer->orders()->where('status', 'completed')->count(),
                'active_carts' => (int) $customer->carts()->where('updated_at', '>=', now()->subDay())->count(),
                'abandoned_carts' => (int) $customer->carts()->where('updated_at', '<', now()->subDay())->count(),
            ],
        ]);
    }

    public function toggleLogin(Customer $customer): RedirectResponse
    {
        $customer->update([
            'is_active' => ! $customer->is_active,
        ]);

        $message = $customer->is_active
            ? 'Login customer berhasil diaktifkan.'
            : 'Login customer berhasil dinonaktifkan.';

        return redirect()->back()->with('success', $message);
    }

    public function resetPassword(Customer $customer): RedirectResponse
    {
        $temporaryPassword = Str::password(12);

        $customer->update([
            'password' => $temporaryPassword,
        ]);

        return redirect()->back()->with(
            'success',
            "Password customer berhasil direset. Password sementara: {$temporaryPassword}",
        );
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        Cart::where('customer_id', $customer->id)->update(['customer_id' => null]);
        Order::where('customer_id', $customer->id)->update(['customer_id' => null]);

        $customer->delete();

        return redirect()->route('customers.index')->with('success', 'Data customer berhasil dihapus.');
    }
}
