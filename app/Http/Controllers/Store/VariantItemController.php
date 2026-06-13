<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\VariantItem\VariantItemRequest;
use App\Http\Requests\Store\VariantItem\VariantItemUpdateRequest;
use App\Models\Shop\Product;
use App\Models\Shop\ProductVariantOption;
use App\Models\Shop\VariantItem;
use App\Models\Unit;
use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class VariantItemController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $productId = $request->query('product_id');

        $props = list_cache()->rememberRequest('variant-items', $request, function () use ($search, $productId) {
            $variantItems = VariantItem::query()
                ->with(['product', 'options.variant'])
                ->withCount(['stockUnits', 'availableStockUnits'])
                ->when($search, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%")
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

            return [
                'variantItems' => $variantItems,
                'products' => Product::select('id', 'name')->orderBy('name')->get(),
                'filters' => [
                    'search' => $search,
                    'product_id' => $productId,
                ],
            ];
        });

        return Inertia::render('Dashboard/Store/VariantItem/Index', $props);
    }

    public function create(Request $request)
    {
        $product = null;
        $combinations = [];

        if ($request->query('product_id')) {
            $product = Product::with('variants.options')->find($request->query('product_id'));
            $combinations = $product ? $this->buildCombinations($product) : [];
        }

        return Inertia::render('Dashboard/Store/VariantItem/Create', [
            'products' => Product::select('id', 'name')->orderBy('name')->get(),
            'product' => $product,
            'combinations' => $combinations,
            'units' => Unit::select('id', 'name', 'code')->where('is_active', true)->get(),
        ]);
    }

    public function store(VariantItemRequest $request)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request) {
            if (isset($data['items'])) {
                foreach ($data['items'] as $itemData) {
                    $this->storeOne($data['product_id'], $itemData);
                }

                return;
            }

            $itemData = Arr::except($data, ['items']);

            if ($request->hasFile('image')) {
                $itemData['image'] = $request->file('image')->store('variant_items', 'public');
            } elseif ($mediaPath = MediaPath::normalize($request->input('image'))) {
                $itemData['image'] = $mediaPath;
            }

            $this->storeOne($data['product_id'], $itemData);
        });

        return $this->redirectAfterMutation($data['product_id'])
            ->with('success', 'Variant items saved successfully.');
    }

    public function show(VariantItem $variantItem)
    {
        return redirect()->route('variant-items.edit', $variantItem);
    }

    public function edit(VariantItem $variantItem)
    {
        $variantItem->load(['product.variants.options', 'options.variant', 'unit']);

        return Inertia::render('Dashboard/Store/VariantItem/Edit', [
            'variantItem' => $variantItem,
            'products' => Product::select('id', 'name')->orderBy('name')->get(),
            'units' => Unit::select('id', 'name', 'code')->where('is_active', true)->get(),
            'productOptions' => $variantItem->product->variants,
        ]);
    }

    public function update(VariantItemUpdateRequest $request, VariantItem $variantItem)
    {
        $data = $request->validated();
        $optionIds = $data['option_ids'];
        $variantData = Arr::except($data, ['option_ids', 'image']);

        if ($request->hasFile('image')) {
            if ($variantItem->image) {
                Storage::disk('public')->delete($variantItem->image);
            }

            $variantData['image'] = $request->file('image')->store('variant_items', 'public');
        } elseif ($request->has('image') && $request->input('image') === '') {
            $variantData['image'] = null;
        } elseif ($request->filled('image')) {
            $variantData['image'] = MediaPath::normalize($request->input('image')) ?? $variantItem->image;
        }

        DB::transaction(function () use ($variantItem, $variantData, $optionIds) {
            $variantItem->update($variantData);
            $this->syncOptionIds($variantItem, $optionIds);
        });

        return $this->redirectAfterMutation($data['product_id'])
            ->with('success', 'Variant item updated successfully.');
    }

    public function destroy(VariantItem $variantItem)
    {
        $productId = $variantItem->product_id;

        if ($variantItem->image) {
            Storage::disk('public')->delete($variantItem->image);
        }

        $variantItem->delete();

        return $this->redirectAfterMutation($productId)
            ->with('success', 'Variant item deleted successfully.');
    }

    private function storeOne(string $productId, array $itemData): VariantItem
    {
        $optionIds = $itemData['option_ids'] ?? [];
        $variantItem = VariantItem::create([
            'product_id' => $productId,
            'unit_id' => $itemData['unit_id'] ?? null,
            'sku' => $itemData['sku'],
            'name' => $itemData['name'],
            'image' => MediaPath::normalize($itemData['image'] ?? null),
            'buying_price' => $itemData['buying_price'] ?? 0,
            'selling_price' => $itemData['selling_price'] ?? 0,
            'track_stock' => $itemData['track_stock'] ?? true,
            'stock' => $itemData['stock'] ?? 0,
            'min_stock_alert' => $itemData['min_stock_alert'] ?? null,
            'weight' => $itemData['weight'] ?? null,
            'is_active' => $itemData['is_active'] ?? true,
        ]);

        $this->syncOptionIds($variantItem, $optionIds);

        return $variantItem;
    }

    private function syncOptionIds(VariantItem $variantItem, array $optionIds): void
    {
        $optionIds = collect($optionIds)
            ->filter()
            ->unique()
            ->values();

        DB::table('variant_item_options')
            ->where('variant_item_id', $variantItem->id)
            ->whereNotIn('product_variant_option_id', $optionIds)
            ->delete();

        foreach ($optionIds as $optionId) {
            $exists = DB::table('variant_item_options')->where([
                'variant_item_id' => $variantItem->id,
                'product_variant_option_id' => $optionId,
            ])->exists();

            if (! $exists) {
                DB::table('variant_item_options')->insert([
                    'id' => (string) Str::uuid(),
                    'variant_item_id' => $variantItem->id,
                    'product_variant_option_id' => $optionId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function buildCombinations(Product $product): array
    {
        $optionGroups = $product->variants
            ->filter(fn ($variant) => $variant->options->isNotEmpty())
            ->map(fn ($variant) => $variant->options->map(fn (ProductVariantOption $option) => [
                'id' => $option->id,
                'value' => $option->value,
                'variant_name' => $variant->name,
            ])->values()->all())
            ->values()
            ->all();

        if ($optionGroups === []) {
            return [];
        }

        $combinations = collect($optionGroups)
            ->reduce(function (array $carry, array $group) {
                if ($carry === []) {
                    return array_map(fn ($option) => [$option], $group);
                }

                $next = [];

                foreach ($carry as $combination) {
                    foreach ($group as $option) {
                        $next[] = [...$combination, $option];
                    }
                }

                return $next;
            }, []);

        return collect($combinations)
            ->map(fn (array $options) => [
                'name' => collect($options)->pluck('value')->implode(' / '),
                'option_ids' => collect($options)->pluck('id')->all(),
                'options' => $options,
            ])
            ->values()
            ->all();
    }

    private function redirectAfterMutation(string $productId)
    {
        $previous = url()->previous();

        if (
            str_contains($previous, '/my-admin/dashboard/ecommerce/products/')
            || str_contains($previous, '/dashboard/ecommerce/products/')
        ) {
            return redirect()->back();
        }

        return redirect()->route('variant-items.index', ['product_id' => $productId]);
    }
}
