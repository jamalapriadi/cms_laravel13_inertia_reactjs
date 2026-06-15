<?php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    use HasFactory;

    protected $table = 'system_countries';

    protected $fillable = [
        'name',
        'name_official',
        'cca2',
        'cca3',
        'flag',
        'latitude',
        'longitude',
        'currencies',
    ];
}
