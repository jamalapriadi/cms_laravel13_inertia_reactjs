<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\Product\ProductRequest;
use App\Http\Requests\Store\Product\ProductUpdateRequest;
use App\Models\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductVariant;
use App\Models\Unit;
use App\Support\MediaPath;
use App\Support\UniqueSlug;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');
        $categoryId = $request->query('category_id');
        $brandId = $request->query('brand_id');

        $products = Product::query()
            ->with(['category', 'brand', 'variants'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('meta_title', 'like', "%{$search}%")
                        ->orWhereHas('variants', function ($qv) use ($search) {
                            $qv->where('sku', 'like', "%{$search}%")
                                ->orWhereHas('stockUnits', function ($stockUnitQuery) use ($search) {
                                    $stockUnitQuery->where('imei_serial_number', 'like', "%{$search}%");
                                });
                        });
                });
            })
            ->when($categoryId, function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->when($brandId, function ($query, $brandId) {
                $query->where('brand_id', $brandId);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $categories = Category::select('id', 'name')->get();
        $brands = Brand::select('id', 'name')->where('is_active', true)->get();

        return Inertia::render('Dashboard/Store/Product/Index', [
            'products' => $products,
            'categories' => $categories,
            'brands' => $brands,
            'summary' => [
                'products' => Product::count(),
                'product_variants' => ProductVariant::count(),
                'brands' => Brand::count(),
                'categories' => Category::count(),
            ],
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId,
                'brand_id' => $brandId,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $categories = Category::select('id', 'name')->get();
        $brands = Brand::select('id', 'name')->where('is_active', true)->get();
        $units = Unit::select('id', 'name', 'code')->where('is_active', true)->get();

        return Inertia::render('Dashboard/Store/Product/Create', [
            'categories' => $categories,
            'brands' => $brands,
            'units' => $units,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ProductRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = UniqueSlug::make(Product::class, $data['name']);

        if (auth()->check()) {
            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();
        }

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = $request->file('thumbnail')->store('products', 'public');
        } elseif ($mediaPath = MediaPath::normalize($request->input('thumbnail'))) {
            $data['thumbnail'] = $mediaPath;
        }

        Product::create($data);

        return redirect()->route('products.index')->with('success', 'Product created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        $product->load([
            'category',
            'brand',
            'images' => function ($query) {
                $query->orderBy('sort_order', 'asc')->latest();
            },
            'specifications' => function ($query) {
                $query->latest();
            },
            'variants' => function ($query) {
                $query->with(['stockUnits' => function ($stockUnitQuery) {
                    $stockUnitQuery->latest();
                }])
                    ->withCount(['stockUnits', 'availableStockUnits'])
                    ->latest();
            },
        ]);

        return Inertia::render('Dashboard/Store/Product/Show', [
            'product' => $product,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        $product->load(['category', 'brand', 'variants.stockUnits']);

        $categories = Category::select('id', 'name')->get();

        $brands = Brand::select('id', 'name')
            ->where('is_active', true)
            ->get();

        $units = Unit::select('id', 'name', 'code')
            ->where('is_active', true)
            ->get();

        return Inertia::render('Dashboard/Store/Product/Edit', [
            'product' => $product,
            'categories' => $categories,
            'brands' => $brands,
            'units' => $units,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ProductUpdateRequest $request, Product $product)
    {
        $data = Arr::except($request->validated(), ['thumbnail']);

        if (isset($data['name']) && $data['name'] !== $product->name) {
            $data['slug'] = UniqueSlug::make(Product::class, $data['name'], ignoreId: $product->id);
        }

        if (auth()->check()) {
            $data['updated_by'] = auth()->id();
        }

        if ($request->hasFile('thumbnail')) {
            if ($product->thumbnail) {
                Storage::disk('public')->delete($product->thumbnail);
            }
            $data['thumbnail'] = $request->file('thumbnail')->store('products', 'public');
        } elseif ($request->has('thumbnail') && $request->input('thumbnail') === '') {
            $data['thumbnail'] = null;
        } elseif ($request->filled('thumbnail')) {
            $data['thumbnail'] = MediaPath::normalize($request->input('thumbnail')) ?? $product->thumbnail;
        }

        $product->update($data);

        return redirect()->route('products.index')->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->route('products.index')->with('success', 'Product deleted successfully.');
    }
}
