<?php

namespace App\Models\Dashboard;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    use HasFactory;

    protected $table = "languages";

    public $appends = [
        'cca2',
        'flag'
    ];

    public function getCCA2Attribute(){
        return strtoupper($this->code);
    }

    public function getFlagAttribute(){
        $country = \App\Models\Dashboard\Country::where('cca2', strtoupper($this->code))->first();

        if($country){
            return $country->flag;
        }else{
            return "";
        }
    }
}
