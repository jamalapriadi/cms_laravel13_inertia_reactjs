<?php

namespace App\Services\Api\V1;

use App\Models\Shop\Cart;
use App\Models\Shop\CartItem;
use App\Models\Shop\Customer;
use App\Models\Shop\Order;
use App\Models\Shop\ProductStockUnit;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CheckoutService
{
    /**
     * @return array<string, mixed>
     */
    public function summary(Customer $customer, ?string $shippingMethod = null): array
    {
        $cart = $this->activeCart($customer);
        $validated = $this->validateCart($cart);
        $selectedShippingMethod = $shippingMethod ?: 'pickup';
        $shippingCost = $this->shippingCost($selectedShippingMethod);
        $subtotal = (float) $validated['subtotal'];

        return [
            'cart_id' => $cart->id,
            'items' => $validated['items']->values(),
            'totals' => [
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'discount' => 0.0,
                'grand_total' => $subtotal + $shippingCost,
            ],
            'shipping_methods' => $this->shippingMethods(),
            'selected_shipping_method' => $selectedShippingMethod,
            'payment_methods' => $this->paymentMethods(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function checkout(Customer $customer, array $data): Order
    {
        return DB::transaction(function () use ($customer, $data): Order {
            $cart = $this->activeCart($customer, lock: true);
            $validated = $this->validateCart($cart, lockStock: true);
            $shippingCost = $this->shippingCost((string) $data['shipping_method']);
            $subtotal = (float) $validated['subtotal'];
            $grandTotal = $subtotal + $shippingCost;

            $order = Order::query()->create([
                'invoice_number' => $this->generateInvoiceNumber(),
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'customer_phone' => $customer->phone,
                'shipping_address' => $data['shipping_address'],
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'discount' => 0,
                'grand_total' => $grandTotal,
                'payment_status' => 'pending',
                'status' => 'pending',
            ]);

            foreach ($validated['items'] as $item) {
                $order->items()->create([
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['variant_item_id'],
                    'product_name' => $item['product_name'],
                    'variant_name' => $item['variant_name'],
                    'price' => $item['price'],
                    'qty' => $item['qty'],
                    'subtotal' => $item['subtotal'],
                ]);

                $this->reserveStock($order, $item);
            }

            $order->payments()->create([
                'payment_method' => $data['payment_method'],
                'amount' => $grandTotal,
                'status' => 'pending',
                'payload' => [
                    'source' => 'checkout_api',
                    'notes' => $data['notes'] ?? null,
                ],
            ]);

            $order->shipping()->create([
                'courier' => $data['shipping_method'],
                'status' => 'pending',
                'shipping_cost' => $shippingCost,
                'shipping_address' => $data['shipping_address'],
            ]);

            $cart->update([
                'status' => 'checked_out',
                'checked_out_at' => now(),
            ]);

            return $order->load($this->orderRelations());
        });
    }

    public function cancel(Customer $customer, string $orderNumber): Order
    {
        return DB::transaction(function () use ($customer, $orderNumber): Order {
            $order = $this->customerOrder($customer, $orderNumber, lock: true);

            if (! in_array($order->status, ['pending', 'processing'], true) || $order->payment_status !== 'pending') {
                throw new RuntimeException('Order cannot be cancelled');
            }

            $order->update([
                'status' => 'cancelled',
                'payment_status' => 'failed',
            ]);

            $order->payments()->where('status', 'pending')->update(['status' => 'failed']);

            ProductStockUnit::query()
                ->where('reserved_order_id', $order->id)
                ->where('status', 'reserved')
                ->update([
                    'status' => 'available',
                    'reserved_order_id' => null,
                    'reserved_at' => null,
                ]);

            return $order->refresh()->load($this->orderRelations());
        });
    }

    public function customerOrder(Customer $customer, string $orderNumber, bool $lock = false): Order
    {
        $query = Order::query()
            ->where('customer_id', $customer->id)
            ->where('invoice_number', $orderNumber);

        if ($lock) {
            $query->lockForUpdate();
        }

        $order = $query->first();

        if (! $order) {
            throw new RuntimeException('Order not found');
        }

        return $order;
    }

    /**
     * @return array<int, string>
     */
    public function orderRelations(): array
    {
        return ['items', 'payments', 'shipping'];
    }

    /**
     * @return list<array{code: string, name: string, cost: float}>
     */
    public function shippingMethods(): array
    {
        return [
            ['code' => 'pickup', 'name' => 'Pickup', 'cost' => 0.0],
            ['code' => 'jne_regular', 'name' => 'JNE Regular', 'cost' => 20000.0],
            ['code' => 'jnt_regular', 'name' => 'J&T Regular', 'cost' => 18000.0],
        ];
    }

    /**
     * @return list<array{code: string, name: string}>
     */
    public function paymentMethods(): array
    {
        return [
            ['code' => 'bank_transfer', 'name' => 'Bank Transfer'],
            ['code' => 'qris', 'name' => 'QRIS'],
            ['code' => 'cash_on_delivery', 'name' => 'Cash on Delivery'],
        ];
    }

    private function activeCart(Customer $customer, bool $lock = false): Cart
    {
        $query = Cart::query()
            ->where('customer_id', $customer->id)
            ->where('status', 'active')
            ->with(['items.product.category', 'items.product.brand', 'items.variant'])
            ->latest('updated_at');

        if ($lock) {
            $query->lockForUpdate();
        }

        $cart = $query->first();

        if (! $cart || $cart->items->isEmpty()) {
            throw new RuntimeException('Cart is empty');
        }

        return $cart;
    }

    /**
     * @return array{subtotal: float, items: Collection<int, array<string, mixed>>}
     */
    private function validateCart(Cart $cart, bool $lockStock = false): array
    {
        $items = $cart->items->map(function (CartItem $cartItem) use ($lockStock): array {
            $product = $cartItem->product;
            $variant = $cartItem->variant;

            if (! $product || ! $product->is_publish || ! $product->category?->is_publish) {
                throw new RuntimeException('Product is no longer available');
            }

            if ($product->brand && ! $product->brand->is_active) {
                throw new RuntimeException('Product brand is no longer available');
            }

            if ($product->has_variant && (! $variant || ! $variant->is_active)) {
                throw new RuntimeException('Variant item is no longer available');
            }

            if (! $product->has_variant && $variant) {
                throw new RuntimeException('Variant item is not available for this product');
            }

            $stockQuery = ProductStockUnit::query()
                ->where('product_id', $product->id)
                ->when($variant, fn (Builder $query) => $query->where('product_variant_id', $variant->id))
                ->when(! $variant, fn (Builder $query) => $query->whereNull('product_variant_id'))
                ->where('status', 'available');

            if ($lockStock) {
                $stockQuery->lockForUpdate();
            }

            $availableStock = $stockQuery->count();

            if ($availableStock < $cartItem->qty) {
                throw new RuntimeException('Insufficient stock for '.$product->name);
            }

            $price = (float) ($variant?->selling_price ?? $product->base_price);

            return [
                'cart_item_id' => $cartItem->id,
                'product_id' => $product->id,
                'variant_item_id' => $variant?->id,
                'product_name' => $product->name,
                'variant_name' => $variant?->name,
                'sku' => $variant?->sku ?? $product->sku,
                'price' => $price,
                'qty' => (int) $cartItem->qty,
                'subtotal' => $price * (int) $cartItem->qty,
                'stock_available' => $availableStock,
            ];
        });

        return [
            'subtotal' => (float) $items->sum('subtotal'),
            'items' => $items,
        ];
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function reserveStock(Order $order, array $item): void
    {
        $stockUnits = ProductStockUnit::query()
            ->where('product_id', $item['product_id'])
            ->when($item['variant_item_id'], fn (Builder $query) => $query->where('product_variant_id', $item['variant_item_id']))
            ->when(! $item['variant_item_id'], fn (Builder $query) => $query->whereNull('product_variant_id'))
            ->where('status', 'available')
            ->lockForUpdate()
            ->limit((int) $item['qty'])
            ->get();

        if ($stockUnits->count() < (int) $item['qty']) {
            throw new RuntimeException('Insufficient stock for '.$item['product_name']);
        }

        foreach ($stockUnits as $stockUnit) {
            $stockUnit->update([
                'status' => 'reserved',
                'reserved_order_id' => $order->id,
                'reserved_at' => now(),
                'note' => trim((string) $stockUnit->note."\nReserved by order {$order->invoice_number}"),
            ]);
        }
    }

    private function shippingCost(string $shippingMethod): float
    {
        $method = collect($this->shippingMethods())->firstWhere('code', $shippingMethod);

        if (! $method) {
            throw new RuntimeException('Shipping method is not available');
        }

        return (float) $method['cost'];
    }

    private function generateInvoiceNumber(): string
    {
        do {
            $invoiceNumber = 'INV-'.now()->format('Ymd').'-'.str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT);
        } while (Order::query()->where('invoice_number', $invoiceNumber)->exists());

        return $invoiceNumber;
    }
}
