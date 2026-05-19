<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\ProductVariant;
use App\Models\Shop\Product;
use App\Http\Requests\Store\ProductVariant\ProductVariantRequest;
use App\Http\Requests\Store\ProductVariant\ProductVariantUpdateRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductVariantController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');
        $productId = $request->query('product_id');

        $variants = ProductVariant::query()
            ->with(['product'])
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
            })
            ->when($productId, function ($query, $productId) {
                $query->where('product_id', $productId);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $products = Product::select('id', 'name')->get();

        return Inertia::render('Dashboard/Store/ProductVariant/Index', [
            'variants' => $variants,
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
        
        return Inertia::render('Dashboard/Store/ProductVariant/Create', [
            'products' => $products
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ProductVariantRequest $request)
    {
        $data = $request->validated();
        
        ProductVariant::create($data);

        return redirect()->route('product-variants.index')->with('success', 'Product Variant created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(ProductVariant $productVariant)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ProductVariant $productVariant)
    {
        $products = Product::select('id', 'name')->get();
            
        return Inertia::render('Dashboard/Store/ProductVariant/Edit', [
            'variant' => $productVariant,
            'products' => $products,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ProductVariantUpdateRequest $request, ProductVariant $productVariant)
    {
        $data = $request->validated();
        
        $productVariant->update($data);

        return redirect()->route('product-variants.index')->with('success', 'Product Variant updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProductVariant $productVariant)
    {
        $productVariant->delete();

        return redirect()->route('product-variants.index')->with('success', 'Product Variant deleted successfully.');
    }
}
