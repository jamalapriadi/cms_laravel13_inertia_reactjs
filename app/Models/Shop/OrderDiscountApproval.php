<?php

namespace App\Models\Shop;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderDiscountApproval extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_id',
        'cashier_session_id',
        'cashier_id',
        'approved_by',
        'approval_type',
        'status',
        'discount_type',
        'discount_value',
        'discount_amount',
        'discount_percentage',
        'subtotal_before_discount',
        'grand_total_after_discount',
        'reason',
        'approval_note',
        'approved_at',
        'rejected_at',
        'items_snapshot',
        'pricing_snapshot',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'subtotal_before_discount' => 'decimal:2',
        'grand_total_after_discount' => 'decimal:2',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'items_snapshot' => 'array',
        'pricing_snapshot' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function cashierSession(): BelongsTo
    {
        return $this->belongsTo(CashierSession::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
