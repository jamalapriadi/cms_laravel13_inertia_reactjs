<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Order;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\Supplier;
use App\Models\Shop\VariantItem;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchOptionController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'in:brands,categories,orders,products,shipping-orders,stock-units,suppliers,units,variant-items'],
            'query' => ['nullable', 'string', 'max:100'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $search = trim($data['query'] ?? '');
        $limit = (int) ($data['limit'] ?? 20);

        $options = match ($data['type']) {
            'brands' => Brand::query()
                ->select('id', 'name')
                ->where('is_active', true)
                ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                ->orderBy('name')
                ->limit($limit)
                ->get()
                ->map(fn (Brand $brand) => [
                    'value' => $brand->id,
                    'label' => $brand->name,
                ]),
            'categories' => Category::query()
                ->select('id', 'name')
                ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                ->orderBy('name')
                ->limit($limit)
                ->get()
                ->map(fn (Category $category) => [
                    'value' => $category->id,
                    'label' => $category->name,
                ]),
            'orders' => $this->orders($search, $limit),
            'products' => Product::query()
                ->select('id', 'name')
                ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                ->orderBy('name')
                ->limit($limit)
                ->get()
                ->map(fn (Product $product) => [
                    'value' => $product->id,
                    'label' => $product->name,
                ]),
            'shipping-orders' => $this->orders($search, $limit, onlyWithoutShipping: true),
            'stock-units' => ProductStockUnit::query()
                ->with('variant.product')
                ->when($search !== '', function ($query) use ($search) {
                    $query->where('imei_serial_number', 'like', "%{$search}%")
                        ->orWhereHas('variant', function ($variantQuery) use ($search) {
                            $variantQuery->where('sku', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%")
                                ->orWhereHas('product', fn ($productQuery) => $productQuery->where('name', 'like', "%{$search}%"));
                        });
                })
                ->latest()
                ->limit($limit)
                ->get()
                ->map(fn (ProductStockUnit $unit) => [
                    'value' => $unit->id,
                    'label' => $unit->imei_serial_number,
                    'description' => trim(($unit->variant?->product?->name ?? 'N/A').' / '.($unit->variant?->name ?? 'N/A').' ('.($unit->variant?->sku ?? 'N/A').')'),
                ]),
            'suppliers' => Supplier::query()
                ->select('id', 'name', 'code')
                ->where('is_active', true)
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($searchQuery) use ($search) {
                        $searchQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
                })
                ->orderBy('name')
                ->limit($limit)
                ->get()
                ->map(fn (Supplier $supplier) => [
                    'value' => $supplier->id,
                    'label' => $supplier->name,
                    'description' => $supplier->code,
                ]),
            'units' => Unit::query()
                ->select('id', 'name', 'code')
                ->where('is_active', true)
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($searchQuery) use ($search) {
                        $searchQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
                })
                ->orderBy('name')
                ->limit($limit)
                ->get()
                ->map(fn (Unit $unit) => [
                    'value' => $unit->id,
                    'label' => $unit->name,
                    'description' => $unit->code,
                ]),
            'variant-items' => VariantItem::query()
                ->with('product')
                ->where('is_active', true)
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($searchQuery) use ($search) {
                        $searchQuery->where('sku', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%")
                            ->orWhereHas('product', fn ($productQuery) => $productQuery->where('name', 'like', "%{$search}%"));
                    });
                })
                ->orderBy('sku')
                ->limit($limit)
                ->get()
                ->map(fn (VariantItem $variant) => [
                    'value' => $variant->id,
                    'label' => trim(($variant->product?->name ?? 'N/A').' - '.$variant->name),
                    'description' => $variant->sku,
                ]),
        };

        return response()->json($options->values());
    }

    private function orders(string $search, int $limit, bool $onlyWithoutShipping = false)
    {
        return Order::query()
            ->select('id', 'invoice_number', 'customer_name', 'shipping_cost')
            ->when($onlyWithoutShipping, fn ($query) => $query->whereDoesntHave('shipping'))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery->where('invoice_number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (Order $order) => [
                'value' => $order->id,
                'label' => $order->invoice_number,
                'description' => trim(($order->customer_name ?: 'Walk-in').' - Rp '.number_format((float) $order->shipping_cost, 0, ',', '.')),
            ]);
    }
}
