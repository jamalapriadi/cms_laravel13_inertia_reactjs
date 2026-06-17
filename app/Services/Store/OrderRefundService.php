<?php

namespace App\Services\Store;

use App\Models\Shop\Order;
use App\Models\Shop\OrderRefund;
use App\Models\Shop\OrderRefundItem;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\VariantItem;
use Illuminate\Support\Facades\DB;

class OrderRefundService
{
    /**
     * Cancel the order entirely.
     */
    public function cancelOrder(Order $order, array $data): OrderRefund
    {
        return DB::transaction(function () use ($order, $data) {
            $order = Order::where('id', $order->id)->lockForUpdate()->first();

            if (in_array($order->status, ['cancelled', 'refunded'])) {
                throw new \Exception("Order cannot be cancelled. Current status: {$order->status}");
            }

            // Create refund record
            $refund = OrderRefund::create([
                'order_id' => $order->id,
                'cashier_session_id' => $order->cashier_session_id,
                'processed_by' => auth()->id() ?? $data['processed_by'] ?? null,
                'type' => 'cancel',
                'refund_status' => 'completed',
                'refund_amount' => $order->grand_total,
                'reason' => $data['reason'] ?? 'Order cancelled',
                'note' => $data['note'] ?? null,
            ]);

            $this->processRefundItems($order, $refund, 'cancel');

            // Update order status
            $order->status = 'cancelled';
            $order->payment_status = 'cancelled';
            $order->cancelled_at = now();
            $order->cancelled_by = auth()->id() ?? $data['processed_by'] ?? null;
            $order->refund_total = $order->grand_total;
            $order->refund_reason = $data['reason'] ?? 'Order cancelled';
            $order->save();

            $this->updateCashierSession($order, $order->grand_total);

            return $refund;
        });
    }

    /**
     * Full refund for a paid/completed order.
     */
    public function fullRefund(Order $order, array $data): OrderRefund
    {
        return DB::transaction(function () use ($order, $data) {
            $order = Order::where('id', $order->id)->lockForUpdate()->first();

            if ($order->status === 'refunded') {
                throw new \Exception("Order has already been fully refunded.");
            }

            // Calculate remaining amount if partially refunded
            $previousRefunds = $order->refunds()->where('refund_status', 'completed')->sum('refund_amount');
            $refundAmount = max(0, $order->grand_total - $previousRefunds);

            // Create refund record
            $refund = OrderRefund::create([
                'order_id' => $order->id,
                'cashier_session_id' => $order->cashier_session_id,
                'processed_by' => auth()->id() ?? $data['processed_by'] ?? null,
                'type' => 'full_refund',
                'refund_status' => 'completed',
                'refund_amount' => $refundAmount,
                'reason' => $data['reason'] ?? 'Full refund',
                'note' => $data['note'] ?? null,
            ]);

            $this->processRefundItems($order, $refund, 'full_refund');

            // Update order status
            $order->status = 'refunded';
            $order->payment_status = 'refunded';
            $order->refunded_at = now();
            $order->refunded_by = auth()->id() ?? $data['processed_by'] ?? null;
            $order->refund_total = $order->grand_total; // total refund equals grand total now
            $order->refund_reason = $data['reason'] ?? 'Full refund';
            $order->save();

            $this->updateCashierSession($order, $refundAmount);

            return $refund;
        });
    }

    /**
     * Partial refund for selected items.
     * $data['items'] should be an array like: [['order_item_id' => '...', 'quantity' => 1, 'reason' => '...']]
     */
    public function partialRefund(Order $order, array $data): OrderRefund
    {
        return DB::transaction(function () use ($order, $data) {
            $order = Order::where('id', $order->id)->lockForUpdate()->first();

            if ($order->status === 'refunded' || $order->status === 'cancelled') {
                throw new \Exception("Order cannot be partially refunded. Current status: {$order->status}");
            }

            $refundAmount = 0;
            $refundItemsToCreate = [];

            // Get existing refunds to calculate available quantities
            $existingRefundItems = OrderRefundItem::where('order_id', $order->id)->get()->groupBy('order_item_id');

            foreach ($data['items'] as $itemData) {
                $orderItem = $order->items()->where('id', $itemData['order_item_id'])->lockForUpdate()->first();
                if (!$orderItem) {
                    throw new \Exception("Order item not found.");
                }

                $refundedQty = $existingRefundItems->has($orderItem->id) ? collect($existingRefundItems[$orderItem->id])->sum('quantity') : 0;
                $availableQty = $orderItem->qty - $refundedQty;

                if ($itemData['quantity'] > $availableQty) {
                    throw new \Exception("Cannot refund more than available quantity for item: {$orderItem->product_name}");
                }

                $itemRefundAmount = $itemData['quantity'] * $orderItem->price;
                $refundAmount += $itemRefundAmount;

                $refundItemsToCreate[] = [
                    'order_item_id' => $orderItem->id,
                    'product_id' => $orderItem->product_id,
                    'variant_item_id' => $orderItem->product_variant_id,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $orderItem->price,
                    'subtotal' => $itemRefundAmount,
                    'reason' => $itemData['reason'] ?? null,
                ];

                $this->restoreStock($orderItem, $itemData['quantity']);
            }

            $refund = OrderRefund::create([
                'order_id' => $order->id,
                'cashier_session_id' => $order->cashier_session_id,
                'processed_by' => auth()->id() ?? $data['processed_by'] ?? null,
                'type' => 'partial_refund',
                'refund_status' => 'completed',
                'refund_amount' => $refundAmount,
                'reason' => $data['reason'] ?? 'Partial refund',
                'note' => $data['note'] ?? null,
            ]);

            foreach ($refundItemsToCreate as $item) {
                $item['order_refund_id'] = $refund->id;
                $item['order_id'] = $order->id;
                OrderRefundItem::create($item);
            }

            // Check if all items are fully refunded now
            $allRefunded = true;
            $totalRefundAmount = $order->refund_total + $refundAmount;

            foreach ($order->items as $item) {
                $refundedQty = OrderRefundItem::where('order_id', $order->id)->where('order_item_id', $item->id)->sum('quantity');
                if ($refundedQty < $item->qty) {
                    $allRefunded = false;
                    break;
                }
            }

            if ($allRefunded || $totalRefundAmount >= $order->grand_total) {
                $order->status = 'refunded';
                $order->payment_status = 'refunded';
                $order->refund_total = $order->grand_total; // cap it at grand total
            } else {
                $order->status = 'partially_refunded';
                $order->payment_status = 'partially_refunded';
                $order->refund_total = $totalRefundAmount;
            }

            $order->save();
            $this->updateCashierSession($order, $refundAmount);

            return $refund;
        });
    }

    /**
     * Process all items for full refund or cancel.
     */
    protected function processRefundItems(Order $order, OrderRefund $refund, string $type)
    {
        // Get existing refunds to calculate available quantities
        $existingRefundItems = OrderRefundItem::where('order_id', $order->id)->get()->groupBy('order_item_id');

        foreach ($order->items as $orderItem) {
            $refundedQty = $existingRefundItems->has($orderItem->id) ? collect($existingRefundItems[$orderItem->id])->sum('quantity') : 0;
            $qtyToRefund = $orderItem->qty - $refundedQty;

            if ($qtyToRefund <= 0) {
                continue; // Already fully refunded
            }

            $subtotal = $qtyToRefund * $orderItem->price;

            OrderRefundItem::create([
                'order_refund_id' => $refund->id,
                'order_id' => $order->id,
                'order_item_id' => $orderItem->id,
                'product_id' => $orderItem->product_id,
                'variant_item_id' => $orderItem->product_variant_id,
                'quantity' => $qtyToRefund,
                'unit_price' => $orderItem->price,
                'subtotal' => $subtotal,
                'reason' => $refund->reason,
            ]);

            $this->restoreStock($orderItem, $qtyToRefund);
        }
    }

    /**
     * Restore stock based on order item.
     */
    protected function restoreStock($orderItem, int $quantity)
    {
        // 1. Stock Unit handling
        // Get reserved stock units for this order and variant/product
        $stockUnits = ProductStockUnit::where('reserved_order_id', $orderItem->order_id)
            ->when($orderItem->product_variant_id, function($q) use ($orderItem) {
                return $q->where('product_variant_id', $orderItem->product_variant_id);
            }, function($q) use ($orderItem) {
                return $q->where('product_id', $orderItem->product_id);
            })
            ->whereIn('status', ['reserved', 'sold'])
            ->limit($quantity)
            ->lockForUpdate()
            ->get();

        foreach ($stockUnits as $unit) {
            $unit->status = 'available';
            $unit->reserved_order_id = null;
            $unit->reserved_at = null;
            $unit->save();
        }

        $restoredUnitCount = $stockUnits->count();
        $remainingQuantity = $quantity - $restoredUnitCount;

        // Note: For regular products/variants without StockUnit tracking, we increment aggregate stock.
        // It seems the app uses VariantItem for product_variants. Let's increment stock.
        if ($remainingQuantity > 0) {
            if ($orderItem->product_variant_id) {
                $variant = VariantItem::where('id', $orderItem->product_variant_id)->lockForUpdate()->first();
                if ($variant) {
                    $variant->increment('stock', $remainingQuantity);
                }
            } else {
                $product = Product::where('id', $orderItem->product_id)->lockForUpdate()->first();
                if ($product && !$product->has_variant) {
                    $product->increment('stock', $remainingQuantity);
                }
            }
        }
    }

    /**
     * Update cashier session with the refunded amount
     */
    protected function updateCashierSession(Order $order, float $refundAmount)
    {
        if (!$order->cashier_session_id) {
            return;
        }

        $session = $order->cashierSession()->lockForUpdate()->first();
        if ($session) {
            // we should not subtract from total_sales, usually total_sales reflects gross sales.
            // but we add to total_refund
            $session->total_refund += $refundAmount;
            
            // if paid by cash, we should reduce the expected cash because cashier gives money back to customer
            if ($order->payment_method === 'cash') {
                $session->expected_cash -= $refundAmount;
            }
            
            // Recalculate difference if shift is somehow closed (though usually refund after close needs admin permission)
            if ($session->closed_at) {
                $session->difference = $session->closing_cash - $session->expected_cash;
            }

            $session->save();
        }
    }
}
