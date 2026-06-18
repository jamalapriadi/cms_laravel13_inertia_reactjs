<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Cashier\PricingApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CashierPricingController extends Controller
{
    public function __construct(
        private readonly PricingApprovalService $pricingApprovalService
    ) {}

    /**
     * Preview pricing calculations and validations for POS checkout.
     */
    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid',
            'items.*.variant_item_id' => 'nullable|uuid',
            'items.*.stock_unit_id' => 'nullable|uuid',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.final_unit_price' => 'nullable|numeric|min:0',
            'items.*.price_override_reason' => 'nullable|string|max:1000',
            'discount_type' => 'nullable|string|in:percentage,nominal',
            'discount_value' => 'nullable|numeric|min:0',
        ]);

        try {
            $discountData = [
                'discount_type' => $validated['discount_type'] ?? null,
                'discount_value' => $validated['discount_value'] ?? 0,
            ];

            $result = $this->pricingApprovalService->calculateCartPricing(
                $validated['items'],
                $discountData,
                $request->user()
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
