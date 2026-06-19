<?php

namespace App\Models\Shop;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashierCashMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'cashier_session_id',
        'cashier_id',
        'created_by',
        'approved_by',
        'type',
        'direction',
        'amount',
        'status',
        'reason',
        'note',
        'approved_at',
        'rejected_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function cashierSession()
    {
        return $this->belongsTo(CashierSession::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
