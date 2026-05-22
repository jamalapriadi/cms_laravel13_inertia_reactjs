<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\ProductStockUnit\ProductStockUnitRequest;
use App\Http\Requests\Store\ProductStockUnit\ProductStockUnitUpdateRequest;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductStockUnitController extends Controller
{
    private function variantOptions()
    {
        return ProductVariant::with('product')
            ->orderBy('name')
            ->get()
            ->map(fn ($variant) => [
                'id' => $variant->id,
                'name' => $variant->product?->name.' - '.$variant->name,
                'sku' => $variant->sku,
            ]);
    }

    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $variantId = $request->query('product_variant_id');

        $stockUnits = ProductStockUnit::query()
            ->with(['variant.product'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('imei_serial_number', 'like', "%{$search}%")
                        ->orWhere('network_compatibility', 'like', "%{$search}%")
                        ->orWhereHas('variant', function ($variantQuery) use ($search) {
                            $variantQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('sku', 'like', "%{$search}%")
                                ->orWhereHas('product', function ($productQuery) use ($search) {
                                    $productQuery->where('name', 'like', "%{$search}%");
                                });
                        });
                });
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($variantId, function ($query, $variantId) {
                $query->where('product_variant_id', $variantId);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $variants = $this->variantOptions();

        $totalStockUnits = ProductStockUnit::count();
        $availableStockUnits = ProductStockUnit::where('status', 'available')->count();

        return Inertia::render('Dashboard/Store/ProductStockUnit/Index', [
            'stockUnits' => $stockUnits,
            'variants' => $variants,
            'summary' => [
                'products' => Product::count(),
                'product_variants' => ProductVariant::count(),
                'stock_units' => $totalStockUnits,
                'available_stock_units' => $availableStockUnits,
                'non_available_stock_units' => $totalStockUnits - $availableStockUnits,
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
                'product_variant_id' => $variantId,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/Store/ProductStockUnit/Create', [
            'variants' => $this->variantOptions(),
        ]);
    }

    public function store(ProductStockUnitRequest $request)
    {
        DB::transaction(function () use ($request) {
            $stockUnit = ProductStockUnit::create($request->validated());

            ProductVariant::findOrFail($stockUnit->product_variant_id)->syncStockFromUnits();
        });

        if (str_contains(url()->previous(), '/dashboard/ecommerce/product-stock-units/create')) {
            return redirect()->route('product-stock-units.index')->with('success', 'Stock unit added successfully.');
        }

        return redirect()->back()->with('success', 'Stock unit added successfully.');
    }

    public function show(ProductStockUnit $productStockUnit): Response
    {
        $productStockUnit->load(['variant.product']);

        return Inertia::render('Dashboard/Store/ProductStockUnit/Show', [
            'stockUnit' => $productStockUnit,
        ]);
    }

    public function edit(ProductStockUnit $productStockUnit): Response
    {
        $productStockUnit->load(['variant.product']);

        return Inertia::render('Dashboard/Store/ProductStockUnit/Edit', [
            'stockUnit' => $productStockUnit,
            'variants' => $this->variantOptions(),
        ]);
    }

    public function update(ProductStockUnitUpdateRequest $request, ProductStockUnit $productStockUnit)
    {
        DB::transaction(function () use ($request, $productStockUnit) {
            $oldVariantId = $productStockUnit->product_variant_id;

            $productStockUnit->update($request->validated());

            ProductVariant::findOrFail($oldVariantId)->syncStockFromUnits();

            if ($oldVariantId !== $productStockUnit->product_variant_id) {
                ProductVariant::findOrFail($productStockUnit->product_variant_id)->syncStockFromUnits();
            }
        });

        if (str_contains(url()->previous(), "/dashboard/ecommerce/product-stock-units/{$productStockUnit->id}/edit")) {
            return redirect()->route('product-stock-units.index')->with('success', 'Stock unit updated successfully.');
        }

        return redirect()->back()->with('success', 'Stock unit updated successfully.');
    }

    public function destroy(ProductStockUnit $productStockUnit)
    {
        DB::transaction(function () use ($productStockUnit) {
            $variantId = $productStockUnit->product_variant_id;

            $productStockUnit->delete();

            ProductVariant::findOrFail($variantId)->syncStockFromUnits();
        });

        return redirect()->back()->with('success', 'Stock unit deleted successfully.');
    }
}
