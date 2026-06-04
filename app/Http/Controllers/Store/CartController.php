<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\Cart;
use App\Models\Shop\CartItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    /**
     * Display a listing of carts, with insights and filters.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $customerType = $request->input('customer_type', $request->input('user_type'));

        $props = list_cache()->rememberRequest('carts', $request, function () use ($search, $customerType) {
            // Calculate summary metrics
            $totalCarts = Cart::count();
            $activeCarts = Cart::where('updated_at', '>=', now()->subDay())->count();
            $abandonedCarts = Cart::where('updated_at', '<', now()->subDay())->count();
            $totalItems = CartItem::sum('qty');

            // Calculate total cart value
            $totalValue = 0.0;
            CartItem::with(['product', 'variant'])->chunk(100, function ($items) use (&$totalValue) {
                foreach ($items as $item) {
                    $totalValue += $item->subtotal;
                }
            });

            // Averages and rates
            $avgCartValue = $totalCarts > 0 ? ($totalValue / $totalCarts) : 0.0;
            $abandonmentRate = $totalCarts > 0 ? (($abandonedCarts / $totalCarts) * 100) : 0.0;

            // Fetch Top 5 Products added to carts
            $topProducts = CartItem::query()
                ->select('product_id', \DB::raw('SUM(qty) as total_qty'))
                ->groupBy('product_id')
                ->orderByDesc('total_qty')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->product_id,
                        'name' => $item->product->name ?? 'Unknown Product',
                        'qty' => (int) $item->total_qty,
                    ];
                });

            // Query carts
            $query = Cart::query()
                ->with(['customer', 'items.product', 'items.variant']);

            if ($customerType === 'registered') {
                $query->whereNotNull('customer_id');
            } elseif ($customerType === 'guest') {
                $query->whereNull('customer_id');
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })->orWhere('id', 'like', "%{$search}%");
                });
            }

            $carts = $query->latest('updated_at')
                ->paginate(10)
                ->withQueryString();

            return [
                'carts' => $carts,
                'summary' => [
                    'total_carts' => (int) $totalCarts,
                    'active_carts' => (int) $activeCarts,
                    'abandoned_carts' => (int) $abandonedCarts,
                    'total_items' => (int) $totalItems,
                    'total_value' => (float) $totalValue,
                    'avg_cart_value' => (float) $avgCartValue,
                    'abandonment_rate' => (float) round($abandonmentRate, 1),
                ],
                'top_products' => $topProducts,
                'filters' => [
                    'search' => $search,
                    'customer_type' => $customerType,
                ],
            ];
        });

        return Inertia::render('Dashboard/Store/Cart/Index', $props);
    }

    /**
     * Display the specified cart detail.
     */
    public function show(Cart $cart): Response
    {
        return Inertia::render('Dashboard/Store/Cart/Show', [
            'cart' => $cart->load(['customer', 'items.product', 'items.variant']),
        ]);
    }

    /**
     * Remove the specified cart from storage.
     */
    public function destroy(Cart $cart): RedirectResponse
    {
        $cart->delete();

        return redirect()->route('carts.index')->with('success', 'Cart deleted successfully.');
    }

    /**
     * Remove the specified item from a cart.
     */
    public function destroyItem(Cart $cart, CartItem $item): RedirectResponse
    {
        abort_if($item->cart_id !== $cart->id, 403);

        $item->delete();

        if ($cart->items()->count() === 0) {
            $cart->delete();

            return redirect()->route('carts.index')->with('success', 'Cart was cleared and deleted because it had no items remaining.');
        }

        return redirect()->back()->with('success', 'Item removed from cart.');
    }
}
