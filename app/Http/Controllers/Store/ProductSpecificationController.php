<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\ProductSpecification;
use App\Models\Shop\Product;
use App\Http\Requests\Store\ProductSpecification\ProductSpecificationRequest;
use App\Http\Requests\Store\ProductSpecification\ProductSpecificationUpdateRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductSpecificationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');
        $productId = $request->query('product_id');

        $specifications = ProductSpecification::query()
            ->with(['product'])
            ->when($search, function ($query, $search) {
                $query->where('spec_name', 'like', "%{$search}%")
                      ->orWhere('spec_value', 'like', "%{$search}%");
            })
            ->when($productId, function ($query, $productId) {
                $query->where('product_id', $productId);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $products = Product::select('id', 'name')->get();

        return Inertia::render('Dashboard/Store/ProductSpecification/Index', [
            'specifications' => $specifications,
            'products' => $products,
            'filters' => [
                'search' => $search,
                'product_id' => $productId,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $products = Product::select('id', 'name')->get();
        return Inertia::render('Dashboard/Store/ProductSpecification/Create', [
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ProductSpecificationRequest $request)
    {
        $data = $request->validated();

        ProductSpecification::create($data);

        return redirect()->route('product-specifications.index')->with('success', 'Product specification added successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ProductSpecification $productSpecification)
    {
        $products = Product::select('id', 'name')->get();
        return Inertia::render('Dashboard/Store/ProductSpecification/Edit', [
            'specification' => $productSpecification,
            'products' => $products,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ProductSpecificationUpdateRequest $request, ProductSpecification $productSpecification)
    {
        $data = $request->validated();

        $productSpecification->update($data);

        return redirect()->route('product-specifications.index')->with('success', 'Product specification updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProductSpecification $productSpecification)
    {
        $productSpecification->delete();

        return redirect()->route('product-specifications.index')->with('success', 'Product specification deleted successfully.');
    }
}
