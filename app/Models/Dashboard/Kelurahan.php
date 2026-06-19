<?php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kelurahan extends Model
{
    use HasFactory;

    protected $table = 'kelurahans';

    protected $primaryKey = 'id';

    public $incrementing = false; // karena char(13)

    protected $keyType = 'string'; // karena primary key string

    protected $fillable = [
        'id',
        'kecamatan_id',
        'name',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    public function kecamatan()
    {
        return $this->belongsTo(Kecamatan::class);
    }

    public function kabupaten()
    {
        return $this->hasOneThrough(
            Kabupaten::class,
            Kecamatan::class,
            'id', // foreign key di kecamatans
            'id', // foreign key di kabupatens
            'kecamatan_id',
            'kabupaten_id'
        );
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

        $allowedSortColumns = ['id', 'name', 'kecamatan_id'];
        if (in_array($sort, $allowedSortColumns)) {
            $query->orderBy($sort, $direction);
        }

        return $query;
    }
}
