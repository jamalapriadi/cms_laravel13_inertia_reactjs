<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Shop\Customer;
use App\Models\Shop\Order;
use App\Services\Api\V1\CheckoutService;
use App\Services\Cache\ListCacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class OrderController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly CheckoutService $checkoutService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

        $payload = app(ListCacheService::class)->rememberRequest('api.orders', $request, function () use ($perPage, $request): array {
            $orders = Order::query()
                ->where('customer_id', $this->customer($request)->id)
                ->with($this->checkoutService->orderRelations())
                ->latest()
                ->paginate($perPage)
                ->withQueryString();

            return [
                'data' => OrderResource::collection($orders->getCollection())->resolve($request),
                'meta' => [
                    'current_page' => $orders->currentPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                    'last_page' => $orders->lastPage(),
                ],
            ];
        });

        return $this->successResponseWithMeta(
            $payload['data'],
            $payload['meta'],
            'Orders retrieved successfully'
        );
    }

    public function show(Request $request, string $orderNumber): JsonResponse
    {
        try {
            $order = $this->checkoutService
                ->customerOrder($this->customer($request), $orderNumber)
                ->load($this->checkoutService->orderRelations());
        } catch (RuntimeException $exception) {
            return $this->errorResponse($exception->getMessage(), 404);
        }

        return $this->successResponse(
            OrderResource::make($order)->resolve($request),
            'Order retrieved successfully'
        );
    }

    public function cancel(Request $request, string $orderNumber): JsonResponse
    {
        try {
            $order = $this->checkoutService->cancel($this->customer($request), $orderNumber);
        } catch (RuntimeException $exception) {
            return $this->errorResponse($exception->getMessage(), 422);
        }

        return $this->successResponse(
            OrderResource::make($order)->resolve($request),
            'Order cancelled successfully'
        );
    }

    private function customer(Request $request): Customer
    {
        /** @var Customer $customer */
        $customer = $request->user('customer_api');

        return $customer;
    }
}
