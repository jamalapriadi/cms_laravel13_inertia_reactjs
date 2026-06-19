<?php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'name',
    ];

    public $incrementing = false; // karena id char(2)

    protected $keyType = 'string';

    public function kabupatens()
    {
        return $this->hasMany(Kabupaten::class);
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

        $allowedSortColumns = ['id', 'name'];
        if (in_array($sort, $allowedSortColumns)) {
            $query->orderBy($sort, $direction);
        }

        return $query;
    }
}
