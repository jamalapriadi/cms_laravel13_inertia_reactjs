<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\ProductImage\ProductImageRequest;
use App\Http\Requests\Store\ProductImage\ProductImageUpdateRequest;
use App\Models\Shop\Product;
use App\Models\Shop\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductImageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $productId = $request->query('product_id');

        $images = ProductImage::query()
            ->with(['product'])
            ->when($productId, function ($query, $productId) {
                $query->where('product_id', $productId);
            })
            ->orderBy('sort_order', 'asc')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $products = Product::select('id', 'name')->get();

        return Inertia::render('Dashboard/Store/ProductImage/Index', [
            'images' => $images,
            'products' => $products,
            'filters' => [
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

        return Inertia::render('Dashboard/Store/ProductImage/Create', [
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ProductImageRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('product_images', 'public');
        }

        // If is_primary is true, un-primary others
        if (! empty($data['is_primary'])) {
            ProductImage::where('product_id', $data['product_id'])
                ->where('is_primary', true)
                ->update(['is_primary' => false]);
        }

        ProductImage::create($data);

        return redirect()->back()->with('success', 'Product image added successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ProductImage $productImage)
    {
        $products = Product::select('id', 'name')->get();

        return Inertia::render('Dashboard/Store/ProductImage/Edit', [
            'productImage' => $productImage,
            'products' => $products,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ProductImageUpdateRequest $request, ProductImage $productImage)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($productImage->image) {
                Storage::disk('public')->delete($productImage->image);
            }
            $data['image'] = $request->file('image')->store('product_images', 'public');
        }

        // If is_primary is true, un-primary others
        if (! empty($data['is_primary'])) {
            ProductImage::where('product_id', $data['product_id'])
                ->where('is_primary', true)
                ->where('id', '!=', $productImage->id)
                ->update(['is_primary' => false]);
        }

        $productImage->update($data);

        return redirect()->back()->with('success', 'Product image updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProductImage $productImage)
    {
        if ($productImage->image) {
            Storage::disk('public')->delete($productImage->image);
        }

        $productImage->delete();

        return redirect()->back()->with('success', 'Product image deleted successfully.');
    }
}
