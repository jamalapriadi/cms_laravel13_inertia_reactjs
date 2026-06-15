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
}
