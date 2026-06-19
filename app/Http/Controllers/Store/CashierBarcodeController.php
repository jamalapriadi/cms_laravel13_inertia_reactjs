<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\VariantItem;
use Illuminate\Http\Request;

class CashierBarcodeController extends Controller
{
    public function scan(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $code = $request->code;

        // 1. Stock Unit by IMEI, serial number, barcode
        $stockUnit = ProductStockUnit::with(['product.brand', 'product.category', 'variantItem'])
            ->where(function ($q) use ($code) {
                $q->where('imei_serial_number', $code)
                    ->orWhere('barcode', $code);
            })->first();

        if ($stockUnit) {
            if ($stockUnit->status !== 'available') {
                return response()->json([
                    'success' => false,
                    'message' => 'Stock unit ditemukan, tetapi statusnya '.$stockUnit->status.' (tidak available).',
                    'data' => null,
                ], 400);
            }

            $product = $stockUnit->product;
            $variant = $stockUnit->variantItem;

            return response()->json([
                'success' => true,
                'message' => 'Stock unit found.',
                'data' => [
                    'id' => 'su_'.$stockUnit->id,
                    'type' => 'stock_unit',
                    'product_id' => $product->id,
                    'variant_item_id' => $variant ? $variant->id : null,
                    'stock_unit_id' => $stockUnit->id,
                    'name' => $product->name,
                    'variant_label' => $variant ? $variant->name : null,
                    'sku' => $variant ? $variant->sku : $product->sku,
                    'barcode' => $stockUnit->barcode ?: $stockUnit->imei_serial_number,
                    'serial_number' => $stockUnit->imei_serial_number,
                    'imei' => $stockUnit->imei_serial_number,
                    'price' => (float) ($variant ? $variant->selling_price : $product->base_price),
                    'stock' => 1,
                    'quantity' => 1,
                    'thumbnail' => $variant && $variant->image ? $variant->image : $product->thumbnail,
                    'brand' => $product->brand ? $product->brand->name : null,
                    'category' => $product->category ? $product->category->name : null,
                ],
            ]);
        }

        // 2. Variant Item by barcode or SKU
        $variant = VariantItem::with(['product.brand', 'product.category'])
            ->where(function ($q) use ($code) {
                $q->where('barcode', $code)
                    ->orWhere('sku', $code);
            })->first();

        if ($variant) {
            if (! $variant->is_active || ! $variant->product || ! $variant->product->is_publish) {
                return response()->json([
                    'success' => false,
                    'message' => 'Varian atau produk tidak aktif.',
                    'data' => null,
                ], 400);
            }

            // check available stock units for this variant
            $availableStock = ProductStockUnit::where('product_variant_id', $variant->id)
                ->where('status', 'available')
                ->count();

            if ($availableStock <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk ditemukan, tetapi stok tidak tersedia.',
                    'data' => null,
                ], 400);
            }

            $product = $variant->product;

            return response()->json([
                'success' => true,
                'message' => 'Variant item found.',
                'data' => [
                    'id' => 'v_'.$variant->id,
                    'type' => 'variant_item',
                    'product_id' => $product->id,
                    'variant_item_id' => $variant->id,
                    'stock_unit_id' => null,
                    'name' => $product->name,
                    'variant_label' => $variant->name,
                    'sku' => $variant->sku,
                    'barcode' => $variant->barcode,
                    'price' => (float) $variant->selling_price,
                    'stock' => $availableStock,
                    'quantity' => 1,
                    'thumbnail' => $variant->image ?: $product->thumbnail,
                    'brand' => $product->brand ? $product->brand->name : null,
                    'category' => $product->category ? $product->category->name : null,
                ],
            ]);
        }

        // 3. Simple Product by barcode or SKU
        $product = Product::with(['brand', 'category'])
            ->where(function ($q) use ($code) {
                $q->where('barcode', $code)
                    ->orWhere('sku', $code);
            })->first();

        if ($product) {
            if (! $product->is_publish) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk tidak aktif/publish.',
                    'data' => null,
                ], 400);
            }

            if ($product->has_variant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk memiliki varian. Silakan scan barcode spesifik variannya.',
                    'data' => null,
                ], 400);
            }

            $availableStock = ProductStockUnit::where('product_id', $product->id)
                ->whereNull('product_variant_id')
                ->where('status', 'available')
                ->count();

            if ($availableStock <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk ditemukan, tetapi stok tidak tersedia.',
                    'data' => null,
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Product found.',
                'data' => [
                    'id' => 'p_'.$product->id,
                    'type' => 'simple_product',
                    'product_id' => $product->id,
                    'variant_item_id' => null,
                    'stock_unit_id' => null,
                    'name' => $product->name,
                    'variant_label' => null,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'price' => (float) $product->base_price,
                    'stock' => $availableStock,
                    'quantity' => 1,
                    'thumbnail' => $product->thumbnail,
                    'brand' => $product->brand ? $product->brand->name : null,
                    'category' => $product->category ? $product->category->name : null,
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Barcode, SKU, serial number, atau IMEI tidak ditemukan.',
            'data' => null,
        ], 404);
    }
}
