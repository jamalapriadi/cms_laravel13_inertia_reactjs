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
}
