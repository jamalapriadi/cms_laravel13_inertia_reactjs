<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\ProductCollection\ProductCollectionRequest;
use App\Http\Resources\Store\ProductCollectionItemResource;
use App\Http\Resources\Store\ProductCollectionResource;
use App\Models\Shop\Product;
use App\Models\Shop\ProductCollection;
use App\Models\Shop\ProductCollectionItem;
use App\Support\MediaPath;
use App\Support\UniqueSlug;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductCollectionController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $type = $request->query('type');
        $isActive = $this->parseNullableBoolean($request->query('is_active'));
        $showHome = $this->parseNullableBoolean($request->query('show_home'));

        $collections = ProductCollection::query()
            ->withCount('items')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%");
                });
            })
            ->type($type)
            ->when($isActive !== null, fn ($query) => $query->where('is_active', $isActive))
            ->when($showHome !== null, fn ($query) => $query->where('show_home', $showHome))
            ->orderBy('sort_order')
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (ProductCollection $collection) => ProductCollectionResource::make($collection)->resolve());

        return Inertia::render('Dashboard/Store/ProductCollection/Index', [
            'collections' => $collections,
            'typeOptions' => $this->typeOptions(),
            'filters' => [
                'search' => $search,
                'type' => $type,
                'is_active' => $isActive,
                'show_home' => $showHome,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Dashboard/Store/ProductCollection/Create', [
            'typeOptions' => $this->typeOptions(),
        ]);
    }

    public function store(ProductCollectionRequest $request)
    {
        $data = $request->validated();

        $data['slug'] = $data['slug']
            ? UniqueSlug::make(ProductCollection::class, $data['slug'])
            : UniqueSlug::make(ProductCollection::class, $data['name']);

        if ($request->hasFile('banner_image')) {
            $data['banner_image'] = $request->file('banner_image')->store('product_collections', 'public');
        } elseif ($mediaPath = MediaPath::normalize($request->input('banner_image'))) {
            $data['banner_image'] = $mediaPath;
        }

        ProductCollection::create($data);

        return redirect()
            ->route('product-collections.index')
            ->with('success', 'Product collection created successfully.');
    }

    public function show(Request $request, ProductCollection $productCollection): Response
    {
        $search = trim((string) $request->query('search', ''));

        $productCollection->loadCount('items');

        $items = ProductCollectionItem::query()
            ->where('product_collection_id', $productCollection->id)
            ->with([
                'product',
                'variantItem.options.variant',
                'variantItem.stockUnits',
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($builder) use ($search) {
                    $builder->whereHas('product', function ($productQuery) use ($search) {
                        $productQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%")
                            ->orWhere('slug', 'like', "%{$search}%");
                    })->orWhereHas('variantItem', function ($variantQuery) use ($search) {
                        $variantQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%")
                            ->orWhereHas('options', fn ($optionQuery) => $optionQuery->where('value', 'like', "%{$search}%"));
                    });
                });
            })
            ->orderBy('sort_order')
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (ProductCollectionItem $item) => ProductCollectionItemResource::make($item)->resolve());

        return Inertia::render('Dashboard/Store/ProductCollection/Show', [
            'collection' => ProductCollectionResource::make($productCollection)->resolve(),
            'items' => $items,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function edit(ProductCollection $productCollection): Response
    {
        return Inertia::render('Dashboard/Store/ProductCollection/Edit', [
            'collection' => ProductCollectionResource::make($productCollection->loadCount('items'))->resolve(),
            'typeOptions' => $this->typeOptions(),
        ]);
    }

    public function update(ProductCollectionRequest $request, ProductCollection $productCollection)
    {
        $data = $request->validated();

        $data['slug'] = $data['slug']
            ? UniqueSlug::make(ProductCollection::class, $data['slug'], ignoreId: $productCollection->id)
            : UniqueSlug::make(ProductCollection::class, $data['name'], ignoreId: $productCollection->id);

        if ($request->hasFile('banner_image')) {
            if ($productCollection->banner_image) {
                Storage::disk('public')->delete($productCollection->banner_image);
            }

            $data['banner_image'] = $request->file('banner_image')->store('product_collections', 'public');
        } elseif ($request->has('banner_image') && $request->input('banner_image') === '') {
            $data['banner_image'] = null;
        } elseif ($request->filled('banner_image')) {
            $data['banner_image'] = MediaPath::normalize($request->input('banner_image')) ?? $productCollection->banner_image;
        }

        $productCollection->update($data);

        return redirect()
            ->route('product-collections.index')
            ->with('success', 'Product collection updated successfully.');
    }

    public function destroy(ProductCollection $productCollection)
    {
        $productCollection->delete();

        return redirect()
            ->route('product-collections.index')
            ->with('success', 'Product collection deleted successfully.');
    }

    public function optionsProducts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['nullable', 'string', 'max:100'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $search = trim((string) ($validated['query'] ?? ''));
        $limit = (int) ($validated['limit'] ?? 20);

        $products = Product::query()
            ->select(['id', 'name', 'slug', 'sku', 'has_variant'])
            ->with([
                'variantItems' => function ($query) {
                    $query->select([
                        'id',
                        'product_id',
                        'name',
                        'sku',
                        'selling_price',
                        'stock',
                        'image',
                        'is_active',
                    ])->with(['options.variant']);
                },
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhereHas('variantItems', function ($variantQuery) use ($search) {
                            $variantQuery->where('sku', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('name')
            ->limit($limit)
            ->get();

        $result = $products->map(function (Product $product) {
            return [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'product_slug' => $product->slug,
                'product_sku' => $product->sku,
                'has_variant' => (bool) $product->has_variant,
                'variant_items' => $product->variantItems
                    ->map(function ($variantItem) {
                        $optionsLabel = $variantItem->options
                            ->map(fn ($option) => trim(($option->variant?->name ?? '').': '.$option->value))
                            ->filter()
                            ->implode(' / ');

                        return [
                            'id' => $variantItem->id,
                            'name' => $variantItem->name,
                            'options_label' => $optionsLabel,
                            'sku' => $variantItem->sku,
                            'selling_price' => (float) $variantItem->selling_price,
                            'stock' => $variantItem->stock,
                            'is_active' => (bool) $variantItem->is_active,
                        ];
                    })
                    ->values(),
            ];
        })->values();

        return response()->json($result);
    }

    private function parseNullableBoolean(mixed $value): ?bool
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_bool($value)) {
            return $value;
        }

        if (in_array($value, ['1', 1, 'true', 'on'], true)) {
            return true;
        }

        if (in_array($value, ['0', 0, 'false', 'off'], true)) {
            return false;
        }

        return null;
    }

    private function typeOptions(): array
    {
        return [
            ['value' => 'best_seller', 'label' => 'Best Seller'],
            ['value' => 'exclusive_deals', 'label' => 'Exclusive Deals'],
            ['value' => 'big_sale', 'label' => 'Big Sale'],
            ['value' => 'flash_sale', 'label' => 'Flash Sale'],
            ['value' => 'promo', 'label' => 'Promo Lainnya'],
        ];
    }
}
