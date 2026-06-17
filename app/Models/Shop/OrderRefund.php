<?php

namespace App\Models\Shop;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OrderRefund extends Model
{
    use HasUuids;

    protected $fillable = [
        'order_id',
        'cashier_session_id',
        'processed_by',
        'type', // cancel, full_refund, partial_refund
        'refund_status',
        'refund_amount',
        'reason',
        'note',
    ];

    protected $casts = [
        'refund_amount' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function cashierSession()
    {
        return $this->belongsTo(CashierSession::class, 'cashier_session_id');
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function items()
    {
        return $this->hasMany(OrderRefundItem::class);
    }
}
