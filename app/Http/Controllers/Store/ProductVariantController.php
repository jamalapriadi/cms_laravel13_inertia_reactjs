<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\ProductVariant\ProductVariantRequest;
use App\Http\Requests\Store\ProductVariant\ProductVariantUpdateRequest;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\ProductVariant;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductVariantController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $productId = $request->query('product_id');

        $variants = ProductVariant::query()
            ->with([
                'product',
                'unit',
                'stockUnits' => function ($query) {
                    $query->latest();
                },
            ])
            ->withCount(['stockUnits', 'availableStockUnits'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhereHas('stockUnits', function ($stockUnitQuery) use ($search) {
                            $stockUnitQuery->where('imei_serial_number', 'like', "%{$search}%");
                        });
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
        $data = $request->validated();
        $stockUnits = $data['stock_units'] ?? [];
        $variantData = Arr::except($data, ['stock_units']);

        if ($request->hasFile('image')) {
            $variantData['image'] = $request->file('image')->store('product_variants', 'public');
        }

        DB::transaction(function () use ($variantData, $stockUnits) {
            $variant = ProductVariant::create($variantData);

            collect($stockUnits)
                ->filter(fn ($stockUnit) => filled($stockUnit['imei_serial_number'] ?? null))
                ->each(function ($stockUnit) use ($variant) {
                    ProductStockUnit::create([
                        'product_variant_id' => $variant->id,
                        'imei_serial_number' => $stockUnit['imei_serial_number'],
                        'network_compatibility' => $stockUnit['network_compatibility'] ?? null,
                        'status' => $stockUnit['status'] ?? 'available',
                        'note' => $stockUnit['note'] ?? null,
                    ]);
                });

            $variant->syncStockFromUnits();
        });

        return $this->redirectAfterMutation()
            ->with('success', 'Product Variant created successfully.');
    }

    public function show(ProductVariant $productVariant)
    {
        $productVariant->load(['product', 'unit', 'stockUnits'])
            ->loadCount(['stockUnits', 'availableStockUnits']);

        return Inertia::render('Dashboard/Store/ProductVariant/Show', [
            'variant' => $productVariant,
        ]);
    }

    public function edit(ProductVariant $productVariant)
    {
        $productVariant->load(['product', 'unit', 'stockUnits'])
            ->loadCount(['stockUnits', 'availableStockUnits']);

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
        $data = $request->validated();
        $variantData = Arr::except($data, ['image']);

        if ($request->hasFile('image')) {
            if ($productVariant->image) {
                Storage::disk('public')->delete($productVariant->image);
            }

            $variantData['image'] = $request->file('image')->store('product_variants', 'public');
        }

        $productVariant->update($variantData);

        return $this->redirectAfterMutation()
            ->with('success', 'Product Variant updated successfully.');
    }

    public function destroy(ProductVariant $productVariant)
    {
        if ($productVariant->image) {
            Storage::disk('public')->delete($productVariant->image);
        }

        $productVariant->delete();

        return $this->redirectAfterMutation()
            ->with('success', 'Product Variant deleted successfully.');
    }

    private function redirectAfterMutation()
    {
        $previous = url()->previous();

        if (str_contains($previous, '/dashboard/ecommerce/products/')) {
            return redirect()->back();
        }

        return redirect()->route('product-variants.index');
    }
}
