<?php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kabupaten extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'province_id',
        'name',
    ];

    public $incrementing = false;

    protected $keyType = 'string';

    public function province()
    {
        return $this->belongsTo(Province::class);
    }

    public function kecamatans()
    {
        return $this->hasMany(Kecamatan::class);
    }

    public function scopeSearch($query, $search)
    {
        return $query->when($search, function ($q, $search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('id', 'like', "%{$search}%");
        });
    }

    public function scopeSort($query, $sort, $direction)
    {
        $sort = $sort ?: 'name';
        $direction = in_array(strtolower($direction ?? ''), ['asc', 'desc']) ? strtolower($direction) : 'asc';

        $allowedSortColumns = ['id', 'name', 'province_id'];
        if (in_array($sort, $allowedSortColumns)) {
            $query->orderBy($sort, $direction);
        }

        return $query;
    }
}
