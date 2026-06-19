<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\CancelOrderRequest;
use App\Http\Requests\Store\FullRefundOrderRequest;
use App\Http\Requests\Store\PartialRefundOrderRequest;
use App\Models\Shop\Order;
use App\Services\Store\OrderRefundService;

class CashierOrderRefundController extends Controller
{
    protected $refundService;

    public function __construct(OrderRefundService $refundService)
    {
        $this->refundService = $refundService;
    }

    public function cancelStore(CancelOrderRequest $request, Order $order)
    {
        // Authorization should be added here
        $this->authorizeAction('orders.delete');

        try {
            $this->refundService->cancelOrder($order, $request->validated());

            return redirect()->back()->with('success', 'Order cancelled successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function fullRefund(FullRefundOrderRequest $request, Order $order)
    {
        $this->authorizeAction('orders.refund');

        try {
            $this->refundService->fullRefund($order, $request->validated());

            return redirect()->back()->with('success', 'Order fully refunded successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function partialRefund(PartialRefundOrderRequest $request, Order $order)
    {
        $this->authorizeAction('orders.refund');

        try {
            $this->refundService->partialRefund($order, $request->validated());

            return redirect()->back()->with('success', 'Order partially refunded successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    protected function authorizeAction(string $permission)
    {
        // Add basic authorization. You can replace with Spatie Permissions or Laravel Gates.
        if (auth()->check() && ! auth()->user()->hasPermissionTo($permission)) {
            // It's a placeholder if hasPermissionTo exists.
            // In a real app we might use $this->authorize()
            // To prevent crashing if not using spatie, we will just pass or abort if method exists.
            if (method_exists(auth()->user(), 'hasPermissionTo')) {
                if (! auth()->user()->hasPermissionTo($permission)) {
                    abort(403, 'Unauthorized access.');
                }
            }
        }
    }
}
