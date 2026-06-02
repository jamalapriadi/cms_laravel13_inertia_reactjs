<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\ProductCollection\ProductCollectionItemRequest;
use App\Models\Shop\ProductCollection;
use App\Models\Shop\ProductCollectionItem;
use App\Models\Shop\VariantItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductCollectionItemController extends Controller
{
    public function store(ProductCollectionItemRequest $request, ProductCollection $productCollection)
    {
        $data = $request->validated();

        $this->validateVariantBelongsToProduct($data['product_id'], $data['variant_item_id'] ?? null);
        $this->ensureNoDuplicate($productCollection, $data['product_id'], $data['variant_item_id'] ?? null);

        DB::transaction(function () use ($productCollection, $data) {
            ProductCollectionItem::create([
                'product_collection_id' => $productCollection->id,
                'product_id' => $data['product_id'],
                'variant_item_id' => $data['variant_item_id'] ?? null,
                'sort_order' => $data['sort_order'] ?? 0,
            ]);
        });

        return redirect()->back()->with('success', 'Collection item added successfully.');
    }

    public function update(
        ProductCollectionItemRequest $request,
        ProductCollection $productCollection,
        ProductCollectionItem $item,
    ) {
        $this->ensureItemBelongsToCollection($productCollection, $item);

        $data = $request->validated();

        $this->validateVariantBelongsToProduct($data['product_id'], $data['variant_item_id'] ?? null);
        $this->ensureNoDuplicate(
            $productCollection,
            $data['product_id'],
            $data['variant_item_id'] ?? null,
            excludeId: $item->id,
        );

        DB::transaction(function () use ($item, $data) {
            $item->update([
                'product_id' => $data['product_id'],
                'variant_item_id' => $data['variant_item_id'] ?? null,
                'sort_order' => $data['sort_order'] ?? 0,
            ]);
        });

        return redirect()->back()->with('success', 'Collection item updated successfully.');
    }

    public function destroy(ProductCollection $productCollection, ProductCollectionItem $item)
    {
        $this->ensureItemBelongsToCollection($productCollection, $item);

        $item->delete();

        return redirect()->back()->with('success', 'Collection item removed successfully.');
    }

    private function validateVariantBelongsToProduct(string $productId, ?string $variantItemId): void
    {
        if (! $variantItemId) {
            return;
        }

        $variantItem = VariantItem::query()
            ->where('id', $variantItemId)
            ->where('product_id', $productId)
            ->exists();

        if (! $variantItem) {
            throw ValidationException::withMessages([
                'variant_item_id' => 'Selected variant item does not belong to selected product.',
            ]);
        }
    }

    private function ensureNoDuplicate(
        ProductCollection $productCollection,
        string $productId,
        ?string $variantItemId,
        ?string $excludeId = null,
    ): void {
        $query = ProductCollectionItem::query()
            ->where('product_collection_id', $productCollection->id)
            ->where('product_id', $productId)
            ->when(
                $variantItemId,
                fn ($builder) => $builder->where('variant_item_id', $variantItemId),
                fn ($builder) => $builder->whereNull('variant_item_id'),
            );

        if ($excludeId) {
            $query->whereKeyNot($excludeId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'product_id' => 'This product/variant combination already exists in the collection.',
            ]);
        }
    }

    private function ensureItemBelongsToCollection(ProductCollection $productCollection, ProductCollectionItem $item): void
    {
        if ($item->product_collection_id !== $productCollection->id) {
            abort(404);
        }
    }
}
