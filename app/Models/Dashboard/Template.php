<?php

// app/Models/Template.php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'description',
        'template_preview',
        'path_template',
        'default',
        'custom_template',
    ];
}
