<?php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kecamatan extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'kabupaten_id',
        'name',
    ];

    public $incrementing = false;

    protected $keyType = 'string';

    public function kabupaten()
    {
        return $this->belongsTo(Kabupaten::class);
    }

    public function kelurahans()
    {
        return $this->hasMany(Kelurahan::class);
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

        $allowedSortColumns = ['id', 'name', 'kabupaten_id'];
        if (in_array($sort, $allowedSortColumns)) {
            $query->orderBy($sort, $direction);
        }

        return $query;
    }
}
