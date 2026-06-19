<?php

namespace App\Models\Dashboard;

use App\Models\BlockTranslation;
use App\Models\ContentEntryTranslation;
use App\Models\PageTranslation;
use App\Models\PostTranslation;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Language extends Model
{
    use HasFactory;

    protected $table = 'languages';

    public $appends = [
        'cca2',
        'flag',
    ];

    protected $fillable = [
        'code',
        'english_name',
        'major',
        'active',
        'default_locale',
        'tag',
        'encode_url',
        'country',
    ];

    public function getCCA2Attribute()
    {
        return strtoupper($this->code);
    }

    public function getFlagAttribute()
    {
        $country = Country::where('cca2', strtoupper($this->code))->first();

        if ($country) {
            return $country->flag;
        }

        return '';
    }

    public function postTranslations(): HasMany
    {
        return $this->hasMany(PostTranslation::class);
    }

    public function pageTranslations(): HasMany
    {
        return $this->hasMany(PageTranslation::class);
    }

    public function blockTranslations(): HasMany
    {
        return $this->hasMany(BlockTranslation::class);
    }

    public function contentEntryTranslations(): HasMany
    {
        return $this->hasMany(ContentEntryTranslation::class);
    }

    public function scopeEnabled($query)
    {
        return $query->where('active', 1);
    }
}
