<?php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Kabupaten extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'province_id',
        'name'
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

}
