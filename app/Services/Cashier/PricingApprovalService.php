<?php

namespace App\Services\Cashier;

use App\Models\Shop\OrderDiscountApproval;
use App\Models\Shop\Product;
use App\Models\Shop\VariantItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PricingApprovalService
{
    /**
     * Calculate cart pricing, apply validation, and check approval requirements.
     */
    public function calculateCartPricing(array $items, array $discountData, User $user): array
    {
        $subtotal = 0;
        $priceOverrideTotal = 0;
        $calculatedItems = [];

        foreach ($items as $item) {
            $productId = $item['product_id'];
            $variantItemId = $item['variant_item_id'] ?? null;
            $qty = (int) ($item['qty'] ?? 1);

            // Fetch original unit price from DB
            $originalPrice = 0;
            $productName = '';
            $variantName = null;

            if ($variantItemId) {
                $variant = VariantItem::with('product')->findOrFail($variantItemId);
                $originalPrice = (float) ($variant->selling_price > 0 ? $variant->selling_price : $variant->product->base_price);
                $productName = $variant->product->name;
                $variantName = $variant->name;
            } else {
                $product = Product::findOrFail($productId);
                $originalPrice = (float) $product->base_price;
                $productName = $product->name;
            }

            $finalPrice = $originalPrice;
            $isOverridden = false;
            $overrideReason = $item['price_override_reason'] ?? null;

            if (isset($item['final_unit_price']) && (float) $item['final_unit_price'] !== (float) $originalPrice) {
                $finalPrice = (float) $item['final_unit_price'];

                if ($finalPrice < 0) {
                    throw ValidationException::withMessages([
                        'items' => ["Harga final untuk {$productName} tidak boleh kurang dari 0."],
                    ]);
                }

                // Check permission for price override
                if (! $user->can('cashier.price_override') && ! $user->hasRole('super-admin')) {
                    throw ValidationException::withMessages([
                        'items' => ["Anda tidak memiliki izin untuk mengubah harga item {$productName}."],
                    ]);
                }

                if (empty(trim($overrideReason))) {
                    throw ValidationException::withMessages([
                        'items' => ["Alasan wajib diisi jika harga item {$productName} diubah."],
                    ]);
                }

                $isOverridden = true;
            }

            $itemSubtotal = $finalPrice * $qty;
            $overrideAmount = ($originalPrice - $finalPrice) * $qty;

            $subtotal += $itemSubtotal;
            $priceOverrideTotal += $overrideAmount;

            $calculatedItems[] = [
                'product_id' => $productId,
                'variant_item_id' => $variantItemId,
                'stock_unit_id' => $item['stock_unit_id'] ?? null,
                'name' => $productName,
                'variant_label' => $variantName,
                'qty' => $qty,
                'original_unit_price' => $originalPrice,
                'final_unit_price' => $finalPrice,
                'price_override_amount' => $overrideAmount,
                'is_price_overridden' => $isOverridden,
                'price_override_reason' => $overrideReason,
                'subtotal' => $itemSubtotal,
            ];
        }

        // Calculate discount
        $discountType = $discountData['discount_type'] ?? null;
        $discountValue = (float) ($discountData['discount_value'] ?? 0);
        $discountAmount = 0;
        $discountPercentage = 0;

        if ($discountType === 'percentage') {
            $discountPercentage = $discountValue;
            $discountAmount = ($subtotal * $discountPercentage) / 100;
        } elseif ($discountType === 'nominal') {
            $discountAmount = $discountValue;
            $discountPercentage = $subtotal > 0 ? ($discountAmount / $subtotal) * 100 : 0;
        }

        if ($discountAmount > $subtotal) {
            $discountAmount = $subtotal;
        }

        $grandTotal = max(0, $subtotal - $discountAmount);

        // Check if discount approval is required
        $requiresApproval = false;
        $approvalReason = null;

        if ($discountAmount > 0) {
            $maxPercentage = (float) config('cashier.discount.max_without_approval_percentage', 5);
            $maxAmount = (float) config('cashier.discount.max_without_approval_amount', 100000);

            // Supervisors and super admins don't need approval for their own transactions
            $isSupervisor = $user->can('cashier.discount.approve') || $user->hasRole('super-admin');

            if (! $isSupervisor) {
                if (! $user->can('cashier.discount.apply')) {
                    $requiresApproval = true;
                    $approvalReason = 'Kasir tidak memiliki izin untuk menerapkan diskon.';
                } elseif ($discountPercentage > $maxPercentage) {
                    $requiresApproval = true;
                    $approvalReason = "Diskon ({$discountPercentage}%) melebihi limit tanpa approval ({$maxPercentage}%).";
                } elseif ($discountAmount > $maxAmount) {
                    $requiresApproval = true;
                    $approvalReason = 'Diskon (Rp'.number_format($discountAmount, 0, ',', '.').') melebihi limit tanpa approval (Rp'.number_format($maxAmount, 0, ',', '.').').';
                }
            }
        }

        return [
            'items' => $calculatedItems,
            'subtotal' => $subtotal,
            'price_override_total' => $priceOverrideTotal,
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
            'discount_amount' => $discountAmount,
            'discount_percentage' => $discountPercentage,
            'grand_total' => $grandTotal,
            'requires_approval' => $requiresApproval,
            'approval_reason' => $approvalReason,
            'can_submit_order' => ! $requiresApproval,
        ];
    }

    /**
     * Create a discount approval request in DB.
     */
    public function createDiscountApproval(array $data, User $cashier): OrderDiscountApproval
    {
        return DB::transaction(function () use ($data, $cashier) {
            // Cancel any pending approvals for this cashier session to prevent duplicate pending approvals
            if (! empty($data['cashier_session_id'])) {
                OrderDiscountApproval::where('cashier_session_id', $data['cashier_session_id'])
                    ->where('status', 'pending')
                    ->update(['status' => 'cancelled']);
            }

            return OrderDiscountApproval::create([
                'cashier_session_id' => $data['cashier_session_id'] ?? null,
                'cashier_id' => $cashier->id,
                'approval_type' => $data['approval_type'] ?? 'order_discount',
                'status' => 'pending',
                'discount_type' => $data['discount_type'] ?? null,
                'discount_value' => $data['discount_value'] ?? 0,
                'discount_amount' => $data['discount_amount'] ?? 0,
                'discount_percentage' => $data['discount_percentage'] ?? 0,
                'subtotal_before_discount' => $data['subtotal_before_discount'],
                'grand_total_after_discount' => $data['grand_total_after_discount'],
                'reason' => $data['reason'],
                'items_snapshot' => $data['items_snapshot'] ?? null,
                'pricing_snapshot' => $data['pricing_snapshot'] ?? null,
            ]);
        });
    }

    /**
     * Approve a discount request.
     */
    public function approve(OrderDiscountApproval $approval, User $approver, ?string $note = null): OrderDiscountApproval
    {
        if ($approval->status !== 'pending') {
            throw new \Exception('Hanya pengajuan berstatus pending yang bisa disetujui.');
        }

        // Cashier cannot approve their own request unless they are super admin
        if ($approval->cashier_id === $approver->id && ! $approver->hasRole('super-admin')) {
            throw new \Exception('Anda tidak dapat menyetujui pengajuan diskon Anda sendiri.');
        }

        $approval->update([
            'status' => 'approved',
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'approval_note' => $note,
        ]);

        return $approval;
    }

    /**
     * Reject a discount request.
     */
    public function reject(OrderDiscountApproval $approval, User $approver, ?string $note = null): OrderDiscountApproval
    {
        if ($approval->status !== 'pending') {
            throw new \Exception('Hanya pengajuan berstatus pending yang bisa ditolak.');
        }

        if ($approval->cashier_id === $approver->id && ! $approver->hasRole('super-admin')) {
            throw new \Exception('Anda tidak dapat menolak pengajuan diskon Anda sendiri.');
        }

        $approval->update([
            'status' => 'rejected',
            'approved_by' => $approver->id,
            'rejected_at' => now(),
            'approval_note' => $note,
        ]);

        return $approval;
    }
}
