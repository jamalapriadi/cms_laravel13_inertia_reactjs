<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CheckoutRequest;
use App\Http\Requests\Api\V1\CheckoutSummaryRequest;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Shop\Customer;
use App\Services\Api\V1\CheckoutService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class CheckoutController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly CheckoutService $checkoutService
    ) {}

    public function summary(CheckoutSummaryRequest $request): JsonResponse
    {
        try {
            $summary = $this->checkoutService->summary(
                $this->customer($request),
                $request->validated('shipping_method')
            );
        } catch (RuntimeException $exception) {
            return $this->errorResponse($exception->getMessage(), 422);
        }

        return $this->successResponse($summary, 'Checkout summary retrieved successfully');
    }

    public function store(CheckoutRequest $request): JsonResponse
    {
        try {
            $order = $this->checkoutService->checkout(
                $this->customer($request),
                $request->validated()
            );
        } catch (RuntimeException $exception) {
            return $this->errorResponse($exception->getMessage(), 422);
        }

        return $this->successResponse(
            OrderResource::make($order)->resolve($request),
            'Checkout completed successfully',
            201
        );
    }

    private function customer(CheckoutSummaryRequest|CheckoutRequest $request): Customer
    {
        /** @var Customer $customer */
        $customer = $request->user('customer_api');

        return $customer;
    }
}
