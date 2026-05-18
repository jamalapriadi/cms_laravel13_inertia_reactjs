<?php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Model;

class Option extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'autoload',
    ];

    protected $casts = [
        'autoload' => 'boolean',
        'value' => 'array'
    ];
}
         