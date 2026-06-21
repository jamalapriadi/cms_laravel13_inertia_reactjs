<?php

namespace App\Models;

use App\Models\Shop\Product;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TermTaxonomy extends Model
{
    use HasFactory;

    protected $table = 'term_taxonomy';

    protected $fillable = [
        'term_id',
        'taxonomy',
        'description',
        'parent_id',
        'count',
    ];

    public function term()
    {
        return $this->belongsTo(Term::class);
    }

    public function parent()
    {
        return $this->belongsTo(TermTaxonomy::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(TermTaxonomy::class, 'parent_id');
    }

    public function posts()
    {
        return $this->belongsToMany(Post::class, 'term_relationships');
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_term_taxonomy', 'term_taxonomy_id', 'product_id');
    }
}
