<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Term;
use App\Models\TermTaxonomy;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TaxonomyController extends Controller
{
    public function index(Request $request, $taxonomy)
    {
        $search = $request->search;

        $props = list_cache()->rememberRequest('taxonomies', $request, function () use ($search, $taxonomy) {
            $taxonomies = TermTaxonomy::with('term')
                ->where('taxonomy', $taxonomy)
                ->when($search, function ($q) use ($search) {
                    $q->whereHas('term', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    });
                })
                ->paginate(10)
                ->withQueryString();

            return [
                'taxonomies' => $taxonomies,
                'taxonomy' => $taxonomy,
                'filters' => ['search' => $search],
            ];
        });

        return Inertia::render('Dashboard/Taxonomies/Index', $props);
    }

    public function create($taxonomy)
    {
        return Inertia::render('Dashboard/Taxonomies/Create', [
            'taxonomy' => $taxonomy,
        ]);
    }

    public function store(Request $request, $taxonomy)
    {
        $request->validate([
            'name' => 'required|string|max:191',
            'description' => 'nullable|string',
        ]);

        $term = Term::create([
            'name' => $request->name,
        ]);

        TermTaxonomy::create([
            'term_id' => $term->id,
            'taxonomy' => $taxonomy,
            'description' => $request->description,
        ]);

        return redirect()->route('taxonomies.index', $taxonomy);
    }

    public function edit($taxonomy, TermTaxonomy $termTaxonomy)
    {
        return Inertia::render('Dashboard/Taxonomies/Edit', [
            'taxonomy' => $taxonomy,
            'item' => $termTaxonomy->load('term'),
        ]);
    }

    public function update(Request $request, $taxonomy, TermTaxonomy $termTaxonomy)
    {
        $request->validate([
            'name' => 'required|string|max:191',
            'slug' => [
                'required',
                'string',
                'max:191',
                Rule::unique('terms', 'slug')->ignore($termTaxonomy->term_id),
            ],
            'description' => 'nullable|string',
        ]);

        $termTaxonomy->term->update([
            'name' => $request->name,
            'slug' => Str::slug($request->slug),
        ]);

        $termTaxonomy->update([
            'description' => $request->description,
        ]);

        return redirect()->route('taxonomies.index', $taxonomy);
    }

    public function destroy($taxonomy, TermTaxonomy $termTaxonomy)
    {
        $termTaxonomy->term->delete();
        $termTaxonomy->delete();

        return back();
    }
}
