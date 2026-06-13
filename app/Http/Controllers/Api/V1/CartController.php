<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\AddCartItemRequest;
use App\Http\Requests\Api\V1\UpdateCartItemRequest;
use App\Http\Resources\Api\V1\CartResource;
use App\Models\Shop\Cart;
use App\Models\Shop\Customer;
use App\Services\Api\V1\CartService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class CartController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly CartService $cartService
    ) {}

    public function show(Request $request): JsonResponse
    {
        $cart = $this->cartService->currentCart(
            $this->customer($request),
            $this->cartToken($request)
        );

        return $this->successResponse(
            $cart ? CartResource::make($cart)->resolve($request) : $this->emptyCartPayload($this->cartToken($request)),
            'Cart retrieved successfully'
        );
    }

    public function store(AddCartItemRequest $request): JsonResponse
    {
        try {
            $cart = $this->cartService->addItem(
                $this->customer($request),
                $this->cartToken($request),
                $request->validated()
            );
        } catch (RuntimeException $exception) {
            return $this->errorResponse($exception->getMessage(), 422);
        }

        return $this->cartResponse($cart, $request, 'Cart item added successfully');
    }

    public function update(UpdateCartItemRequest $request, string $item): JsonResponse
    {
        $cart = $this->resolvedCart($request);

        if (! $cart) {
            return $this->errorResponse('Cart not found', 404);
        }

        try {
            $cart = $this->cartService->updateItem($cart, $item, (int) $request->validated('qty'));
        } catch (RuntimeException $exception) {
            return $this->errorResponse($exception->getMessage(), 422);
        }

        return $this->cartResponse($cart, $request, 'Cart item updated successfully');
    }

    public function patch(UpdateCartItemRequest $request, string $item): JsonResponse
    {
        return $this->update($request, $item);
    }

    public function destroy(Request $request, string $item): JsonResponse
    {
        $cart = $this->resolvedCart($request);

        if (! $cart) {
            return $this->errorResponse('Cart not found', 404);
        }

        try {
            $cart = $this->cartService->removeItem($cart, $item);
        } catch (RuntimeException $exception) {
            return $this->errorResponse($exception->getMessage(), 422);
        }

        return $this->successResponse(
            $cart ? CartResource::make($cart)->resolve($request) : $this->emptyCartPayload($this->cartToken($request)),
            'Cart item removed successfully'
        );
    }

    public function clear(Request $request): JsonResponse
    {
        $cart = $this->resolvedCart($request);

        if ($cart) {
            $this->cartService->clear($cart);
        }

        return $this->successResponse($this->emptyCartPayload($this->cartToken($request)), 'Cart cleared successfully');
    }

    private function resolvedCart(Request $request): ?Cart
    {
        return $this->cartService->currentCart(
            $this->customer($request),
            $this->cartToken($request)
        );
    }

    private function customer(Request $request): ?Customer
    {
        $customer = $request->user('customer_api');

        return $customer instanceof Customer ? $customer : null;
    }

    private function cartToken(Request $request): ?string
    {
        $token = trim((string) $request->header('X-Cart-Token', ''));

        return $token !== '' ? $token : null;
    }

    private function cartResponse(Cart $cart, Request $request, string $message): JsonResponse
    {
        return $this->successResponse(
            CartResource::make($cart)->resolve($request),
            $message
        )->header('X-Cart-Token', (string) $cart->cart_token);
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyCartPayload(?string $cartToken): array
    {
        return [
            'id' => null,
            'cart_token' => $cartToken,
            'customer_id' => null,
            'is_guest' => true,
            'total_qty' => 0,
            'total_price' => 0,
            'items' => [],
        ];
    }
}
