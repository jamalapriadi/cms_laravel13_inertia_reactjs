<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\ProductVariant\ProductVariantRequest;
use App\Http\Requests\Store\ProductVariant\ProductVariantUpdateRequest;
use App\Models\Shop\Product;
use App\Models\Shop\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductVariantController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $productId = $request->query('product_id');

        $variants = ProductVariant::query()
            ->with(['product', 'options'])
            ->withCount('options')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhereHas('product', function ($productQuery) use ($search) {
                            $productQuery->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('options', function ($optionQuery) use ($search) {
                            $optionQuery->where('value', 'like', "%{$search}%");
                        });
                });
            })
            ->when($productId, fn ($query, $productId) => $query->where('product_id', $productId))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Dashboard/Store/ProductVariant/Index', [
            'variants' => $variants,
            'products' => Product::select('id', 'name')->orderBy('name')->get(),
            'filters' => [
                'search' => $search,
                'product_id' => $productId,
            ],
        ]);
    }

    public function create(Request $request)
    {
        return Inertia::render('Dashboard/Store/ProductVariant/Create', [
            'products' => Product::select('id', 'name')->orderBy('name')->get(),
            'selectedProductId' => $request->query('product_id'),
        ]);
    }

    public function store(ProductVariantRequest $request)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data) {
            $variants = $data['variants'] ?? [[
                'name' => $data['name'],
                'options' => $data['options'] ?? [],
            ]];

            foreach ($variants as $index => $variantData) {
                $variant = ProductVariant::updateOrCreate(
                    [
                        'product_id' => $data['product_id'],
                        'name' => $variantData['name'],
                    ],
                    ['sort_order' => $index],
                );

                $this->syncOptions($variant, $variantData['options'] ?? []);
            }
        });

        return $this->redirectAfterMutation($data['product_id'])
            ->with('success', 'Product variants saved successfully.');
    }

    public function show(ProductVariant $productVariant)
    {
        return redirect()->route('product-variants.edit', $productVariant);
    }

    public function edit(ProductVariant $productVariant)
    {
        $productVariant->load(['product', 'options']);

        return Inertia::render('Dashboard/Store/ProductVariant/Edit', [
            'variant' => $productVariant,
            'products' => Product::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function update(ProductVariantUpdateRequest $request, ProductVariant $productVariant)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $productVariant) {
            $productVariant->update([
                'product_id' => $data['product_id'],
                'name' => $data['name'],
            ]);

            $this->syncOptions($productVariant, $data['options'] ?? []);
        });

        return $this->redirectAfterMutation($data['product_id'])
            ->with('success', 'Product variant updated successfully.');
    }

    public function destroy(ProductVariant $productVariant)
    {
        $productId = $productVariant->product_id;

        $productVariant->delete();

        return $this->redirectAfterMutation($productId)
            ->with('success', 'Product variant deleted successfully.');
    }

    private function syncOptions(ProductVariant $variant, array $options): void
    {
        $values = collect($options)
            ->map(fn ($option) => trim((string) $option))
            ->filter()
            ->unique()
            ->values();

        $variant->options()
            ->whereNotIn('value', $values)
            ->delete();

        $values->each(function (string $value, int $index) use ($variant) {
            $variant->options()->updateOrCreate(
                ['value' => $value],
                ['sort_order' => $index],
            );
        });
    }

    private function redirectAfterMutation(string $productId)
    {
        $previous = url()->previous();

        if (str_contains($previous, '/dashboard/ecommerce/products/')) {
            return redirect()->back();
        }

        return redirect()->route('product-variants.index', ['product_id' => $productId]);
    }
}
