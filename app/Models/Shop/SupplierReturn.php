<?php

namespace App\Models\Shop;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupplierReturn extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'supplier_returns';

    protected $fillable = [
        'supplier_id',
        'return_number',
        'return_date',
        'status',
        'note',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'return_date' => 'date',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(SupplierReturnItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
