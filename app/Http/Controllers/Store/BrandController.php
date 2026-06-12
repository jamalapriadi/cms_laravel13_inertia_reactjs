<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\Brand\BrandRequest;
use App\Http\Requests\Store\Brand\BrandUpdateRequest;
use App\Models\Brand;
use App\Models\Shop\Product;
use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BrandController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');

        $props = list_cache()->rememberRequest('brands-v2', $request, function () use ($search) {
            $brands = Brand::query()
                ->withCount('products')
                ->when($search, function ($query, $search) {
                    $query->where('name', 'like', "%{$search}%");
                })
                ->latest()
                ->paginate(10)
                ->through(fn (Brand $brand): array => [
                    ...$brand->toArray(),
                    'products_count' => (int) ($brand->products_count ?? 0),
                ])
                ->withQueryString();

            return [
                'brands' => $brands,
                'summary' => [
                    'brands' => Brand::query()->count(),
                    'products' => Product::query()
                        ->whereHas('brand')
                        ->count(),
                ],
                'filters' => ['search' => $search],
            ];
        });

        return Inertia::render('Dashboard/Store/Brand/Index', $props);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Dashboard/Store/Brand/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(BrandRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']);

        if (auth()->check()) {
            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();
        }

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('brands', 'public');
        } elseif ($mediaPath = MediaPath::normalize($request->input('logo'))) {
            $data['logo'] = $mediaPath;
        }

        Brand::create($data);

        return redirect()->route('brands.index')->with('success', 'Brand created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Brand $brand)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Brand $brand)
    {
        return Inertia::render('Dashboard/Store/Brand/Edit', [
            'brand' => $brand,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(BrandUpdateRequest $request, Brand $brand)
    {
        $data = Arr::except($request->validated(), ['logo']);

        if (isset($data['name']) && $data['name'] !== $brand->name) {
            $data['slug'] = Str::slug($data['name']);
        }

        if (auth()->check()) {
            $data['updated_by'] = auth()->id();
        }

        if ($request->hasFile('logo')) {
            if ($brand->logo) {
                Storage::disk('public')->delete($brand->logo);
            }
            $data['logo'] = $request->file('logo')->store('brands', 'public');
        } elseif ($request->has('logo') && $request->input('logo') === '') {
            $data['logo'] = null;
        } elseif ($request->filled('logo')) {
            $data['logo'] = MediaPath::normalize($request->input('logo')) ?? $brand->logo;
        }

        $brand->update($data);

        return redirect()->route('brands.index')->with('success', 'Brand updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Brand $brand)
    {
        $brand->delete();

        return redirect()->route('brands.index')->with('success', 'Brand deleted successfully.');
    }
}
