<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\ProductVariant\ProductVariantRequest;
use App\Http\Requests\Store\ProductVariant\ProductVariantUpdateRequest;
use App\Models\Shop\Product;
use App\Models\Shop\ProductVariant;
use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductVariantController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $productId = $request->query('product_id');

        $variants = ProductVariant::query()
            ->with(['product', 'unit'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
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

    public function create()
    {
        return Inertia::render('Dashboard/Store/ProductVariant/Create', [
            'products' => Product::select('id', 'name')->get(),
            'units' => Unit::select('id', 'name', 'code')
                ->where('is_active', true)
                ->get(),
        ]);
    }

    public function store(ProductVariantRequest $request)
    {
        ProductVariant::create($request->validated());

        return redirect()
            ->route('product-variants.index')
            ->with('success', 'Product Variant created successfully.');
    }

    public function show(ProductVariant $productVariant)
    {
        $productVariant->load(['product', 'unit']);

        return Inertia::render('Dashboard/Store/ProductVariant/Show', [
            'variant' => $productVariant,
        ]);
    }

    public function edit(ProductVariant $productVariant)
    {
        $productVariant->load(['product', 'unit']);

        return Inertia::render('Dashboard/Store/ProductVariant/Edit', [
            'variant' => $productVariant,
            'products' => Product::select('id', 'name')->get(),
            'units' => Unit::select('id', 'name', 'code')
                ->where('is_active', true)
                ->get(),
        ]);
    }

    public function update(
        ProductVariantUpdateRequest $request,
        ProductVariant $productVariant
    ) {
        $productVariant->update($request->validated());

        return redirect()
            ->route('product-variants.index')
            ->with('success', 'Product Variant updated successfully.');
    }

    public function destroy(ProductVariant $productVariant)
    {
        $productVariant->delete();

        return redirect()
            ->route('product-variants.index')
            ->with('success', 'Product Variant deleted successfully.');
    }
}