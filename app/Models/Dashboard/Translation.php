<?php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Model;

class Translation extends Model
{
    protected $fillable = [
        'key',
        'value',
        'locale',
    ];
}
