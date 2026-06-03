<?php

namespace App\Services\Api\V1;

use App\Models\Shop\Cart;
use App\Models\Shop\CartItem;
use App\Models\Shop\Customer;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\VariantItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class CartService
{
    public function currentCart(?Customer $customer, ?string $cartToken, bool $create = false): ?Cart
    {
        $cart = $customer
            ? $this->customerCart($customer, $cartToken)
            : $this->guestCart($cartToken);

        if (! $cart && $create) {
            $cart = Cart::query()->create([
                'customer_id' => $customer?->id,
                'cart_token' => $cartToken ?: $this->generateCartToken(),
                'status' => 'active',
            ]);
        }

        return $cart?->load($this->cartRelations());
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function addItem(?Customer $customer, ?string $cartToken, array $data): Cart
    {
        return DB::transaction(function () use ($customer, $cartToken, $data): Cart {
            $product = $this->publicProduct((string) $data['product_id']);
            $variant = $this->variantForProduct($product, $data['variant_item_id'] ?? $data['product_variant_id'] ?? null);
            $qty = (int) ($data['qty'] ?? 1);

            $this->assertPurchasable($product, $variant, $qty);

            $cart = $this->currentCart($customer, $cartToken, create: true);
            $item = $cart->items()
                ->where('product_id', $product->id)
                ->where('product_variant_id', $variant?->id)
                ->first();

            $newQty = $qty + (int) ($item?->qty ?? 0);
            $this->assertPurchasable($product, $variant, $newQty);

            if ($item) {
                $item->update(['qty' => $newQty]);
            } else {
                $cart->items()->create([
                    'product_id' => $product->id,
                    'product_variant_id' => $variant?->id,
                    'qty' => $qty,
                ]);
            }

            $cart->touch();

            return $cart->refresh()->load($this->cartRelations());
        });
    }

    public function updateItem(Cart $cart, string $itemId, int $qty): Cart
    {
        return DB::transaction(function () use ($cart, $itemId, $qty): Cart {
            $item = $cart->items()->whereKey($itemId)->first();

            if (! $item) {
                throw new RuntimeException('Cart item not found');
            }

            $product = $this->publicProduct($item->product_id);
            $variant = $this->variantForProduct($product, $item->product_variant_id);

            $this->assertPurchasable($product, $variant, $qty);
            $item->update(['qty' => $qty]);
            $cart->touch();

            return $cart->refresh()->load($this->cartRelations());
        });
    }

    public function removeItem(Cart $cart, string $itemId): ?Cart
    {
        return DB::transaction(function () use ($cart, $itemId): ?Cart {
            $item = $cart->items()->whereKey($itemId)->first();

            if (! $item) {
                throw new RuntimeException('Cart item not found');
            }

            $item->delete();

            if (! $cart->items()->exists()) {
                $cart->delete();

                return null;
            }

            $cart->touch();

            return $cart->refresh()->load($this->cartRelations());
        });
    }

    public function clear(Cart $cart): void
    {
        $cart->delete();
    }

    public function mergeGuestCartForCustomer(Customer $customer, ?string $cartToken): ?Cart
    {
        if (! $cartToken) {
            return $this->currentCart($customer, null);
        }

        return DB::transaction(function () use ($customer, $cartToken): ?Cart {
            $guestCart = Cart::query()
                ->where('cart_token', $cartToken)
                ->whereNull('customer_id')
                ->where('status', 'active')
                ->with('items')
                ->lockForUpdate()
                ->first();

            $customerCart = Cart::query()
                ->where('customer_id', $customer->id)
                ->where('status', 'active')
                ->latest('updated_at')
                ->with('items')
                ->lockForUpdate()
                ->first();

            if (! $guestCart) {
                return $customerCart?->load($this->cartRelations());
            }

            if (! $customerCart) {
                $guestCart->update(['customer_id' => $customer->id]);

                return $guestCart->refresh()->load($this->cartRelations());
            }

            foreach ($guestCart->items as $guestItem) {
                try {
                    $product = $this->publicProduct($guestItem->product_id);
                    $variant = $this->variantForProduct($product, $guestItem->product_variant_id);
                    $availableStock = $this->availableStock($product, $variant);
                } catch (RuntimeException) {
                    $guestItem->delete();

                    continue;
                }

                if ($availableStock < 1) {
                    $guestItem->delete();

                    continue;
                }

                $targetItem = $customerCart->items
                    ->first(fn (CartItem $item): bool => $item->product_id === $guestItem->product_id
                        && $item->product_variant_id === $guestItem->product_variant_id);

                if ($targetItem) {
                    $targetItem->update(['qty' => min($targetItem->qty + $guestItem->qty, $availableStock)]);
                    $guestItem->delete();
                } else {
                    $guestItem->update([
                        'cart_id' => $customerCart->id,
                        'qty' => min($guestItem->qty, $availableStock),
                    ]);
                }
            }

            if (! $customerCart->cart_token) {
                $customerCart->update(['cart_token' => $cartToken]);
            }

            $guestCart->delete();

            return $customerCart->refresh()->load($this->cartRelations());
        });
    }

    /**
     * @return array<int, mixed>
     */
    public function cartRelations(): array
    {
        return [
            'items' => fn ($query) => $query->latest(),
            'items.product' => fn ($query) => $query->withCount('availableStockUnits'),
            'items.variant' => fn ($query) => $query->withCount('availableStockUnits'),
        ];
    }

    private function customerCart(Customer $customer, ?string $cartToken): ?Cart
    {
        $cart = Cart::query()
            ->where('customer_id', $customer->id)
            ->where('status', 'active')
            ->latest('updated_at')
            ->first();

        if ($cart) {
            return $cart;
        }

        if (! $cartToken) {
            return null;
        }

        return Cart::query()
            ->where('cart_token', $cartToken)
            ->whereNull('customer_id')
            ->where('status', 'active')
            ->first();
    }

    private function guestCart(?string $cartToken): ?Cart
    {
        if (! $cartToken) {
            return null;
        }

        return Cart::query()
            ->where('cart_token', $cartToken)
            ->whereNull('customer_id')
            ->where('status', 'active')
            ->first();
    }

    private function publicProduct(string $productId): Product
    {
        $product = Product::query()
            ->whereKey($productId)
            ->where('is_publish', true)
            ->whereHas('category', fn (Builder $query) => $query->where('is_publish', true))
            ->where(function (Builder $query): void {
                $query->whereNull('brand_id')
                    ->orWhereHas('brand', fn (Builder $brandQuery) => $brandQuery->where('is_active', true));
            })
            ->first();

        if (! $product) {
            throw new RuntimeException('Product not found or unavailable');
        }

        return $product;
    }

    private function variantForProduct(Product $product, mixed $variantId): ?VariantItem
    {
        if (! $variantId) {
            return null;
        }

        $variant = VariantItem::query()
            ->whereKey($variantId)
            ->where('product_id', $product->id)
            ->where('is_active', true)
            ->first();

        if (! $variant) {
            throw new RuntimeException('Variant item not found or unavailable');
        }

        return $variant;
    }

    private function assertPurchasable(Product $product, ?VariantItem $variant, int $qty): void
    {
        if ($product->has_variant && ! $variant) {
            throw new RuntimeException('Variant item is required for this product');
        }

        if (! $product->has_variant && $variant) {
            throw new RuntimeException('Variant item is not available for this product');
        }

        if ($this->availableStock($product, $variant) < $qty) {
            throw new RuntimeException('Insufficient stock');
        }
    }

    private function availableStock(Product $product, ?VariantItem $variant): int
    {
        return ProductStockUnit::query()
            ->where('product_id', $product->id)
            ->when($variant, fn (Builder $query) => $query->where('product_variant_id', $variant->id))
            ->when(! $variant, fn (Builder $query) => $query->whereNull('product_variant_id'))
            ->where('status', 'available')
            ->count();
    }

    private function generateCartToken(): string
    {
        do {
            $token = Str::random(64);
        } while (Cart::query()->where('cart_token', $token)->exists());

        return $token;
    }
}
