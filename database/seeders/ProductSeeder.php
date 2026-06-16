<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $brandIds = DB::table('brands')->pluck('id', 'slug');
            $categoryIds = DB::table('categories')->pluck('id', 'slug');
            $pieceUnitId = DB::table('units')->where('code', 'PCS')->value('id');

            $products = [
                [
                    'name' => 'iPhone 15',
                    'slug' => 'iphone-15',
                    'sku' => 'IP15',
                    'category_slug' => 'iphone',
                    'brand_slug' => 'apple',
                    'base_price' => 12999000,
                    'has_variant' => true,
                    'template' => 'iphone',
                ],
                [
                    'name' => 'iPhone 15 Pro',
                    'slug' => 'iphone-15-pro',
                    'sku' => 'IP15P',
                    'category_slug' => 'iphone',
                    'brand_slug' => 'apple',
                    'base_price' => 17999000,
                    'has_variant' => true,
                    'template' => 'iphone',
                ],
                [
                    'name' => 'iPhone 16',
                    'slug' => 'iphone-16',
                    'sku' => 'IP16',
                    'category_slug' => 'iphone',
                    'brand_slug' => 'apple',
                    'base_price' => 14999000,
                    'has_variant' => true,
                    'template' => 'iphone',
                ],
                [
                    'name' => 'MacBook Air M2',
                    'slug' => 'macbook-air-m2',
                    'sku' => 'MBA-M2',
                    'category_slug' => 'macbook',
                    'brand_slug' => 'apple',
                    'base_price' => 16499000,
                    'has_variant' => true,
                    'template' => 'macbook',
                ],
                [
                    'name' => 'MacBook Air M3',
                    'slug' => 'macbook-air-m3',
                    'sku' => 'MBA-M3',
                    'category_slug' => 'macbook',
                    'brand_slug' => 'apple',
                    'base_price' => 18999000,
                    'has_variant' => true,
                    'template' => 'macbook',
                ],
                [
                    'name' => 'MacBook Pro M3',
                    'slug' => 'macbook-pro-m3',
                    'sku' => 'MBP-M3',
                    'category_slug' => 'macbook',
                    'brand_slug' => 'apple',
                    'base_price' => 26999000,
                    'has_variant' => true,
                    'template' => 'macbook',
                ],
                [
                    'name' => 'iPhone 16e (Single Unit Demo)',
                    'slug' => 'iphone-16e-single-unit-demo',
                    'sku' => 'IP16E-DEMO',
                    'category_slug' => 'iphone',
                    'brand_slug' => 'apple',
                    'base_price' => 11999000,
                    'has_variant' => false,
                    'template' => 'non_variant',
                ],
            ];

            foreach ($products as $product) {
                $brandId = $brandIds[$product['brand_slug']] ?? null;
                $categoryId = $categoryIds[$product['category_slug']] ?? null;

                if (! $brandId || ! $categoryId) {
                    continue;
                }

                $productId = $this->upsertProduct([
                    'category_id' => $categoryId,
                    'brand_id' => $brandId,
                    'unit_id' => $pieceUnitId,
                    'name' => $product['name'],
                    'slug' => $product['slug'],
                    'sku' => $product['sku'],
                    'description' => $product['name'].' sample seeded product',
                    'condition' => 'new',
                    'base_price' => $product['base_price'],
                    'has_variant' => $product['has_variant'],
                    'meta_title' => $product['name'],
                    'meta_description' => 'Sample product for inventory testing',
                    'is_publish' => true,
                ]);

                if ($product['template'] === 'iphone') {
                    $this->seedIphoneVariants($productId, $product['sku'], $pieceUnitId, (float) $product['base_price']);
                }

                if ($product['template'] === 'macbook') {
                    $this->seedMacbookVariants($productId, $product['sku'], $pieceUnitId, (float) $product['base_price']);
                }

                if ($product['template'] === 'non_variant') {
                    $this->seedNonVariantStockUnit($productId, $product['sku']);
                }
            }
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function upsertProduct(array $data): string
    {
        $existing = DB::table('products')->where('slug', $data['slug'])->first();

        if ($existing) {
            DB::table('products')->where('id', $existing->id)->update([
                'category_id' => $data['category_id'],
                'brand_id' => $data['brand_id'],
                'unit_id' => $data['unit_id'],
                'name' => $data['name'],
                'sku' => $data['sku'],
                'description' => $data['description'],
                'condition' => $data['condition'],
                'base_price' => $data['base_price'],
                'has_variant' => $data['has_variant'],
                'meta_title' => $data['meta_title'],
                'meta_description' => $data['meta_description'],
                'is_publish' => $data['is_publish'],
                'updated_at' => now(),
                'deleted_at' => null,
            ]);

            return (string) $existing->id;
        }

        $id = (string) Str::uuid();

        DB::table('products')->insert([
            'id' => $id,
            ...$data,
            'thumbnail' => null,
            'created_by' => null,
            'updated_by' => null,
            'created_at' => now(),
            'updated_at' => now(),
            'deleted_at' => null,
        ]);

        return $id;
    }

    private function seedIphoneVariants(string $productId, string $skuPrefix, ?string $unitId, float $basePrice): void
    {
        $variants = [
            'Color' => ['Black', 'Blue'],
            'Storage' => ['128GB', '256GB'],
        ];

        $variantIds = $this->upsertVariantDimensions($productId, $variants);
        $optionIds = $this->upsertVariantOptions($variantIds, $variants);

        $combos = [
            ['color' => 'Black', 'storage' => '128GB', 'suffix' => 'BLK-128', 'extra' => 0],
            ['color' => 'Black', 'storage' => '256GB', 'suffix' => 'BLK-256', 'extra' => 2000000],
            ['color' => 'Blue', 'storage' => '128GB', 'suffix' => 'BLU-128', 'extra' => 0],
            ['color' => 'Blue', 'storage' => '256GB', 'suffix' => 'BLU-256', 'extra' => 2000000],
        ];

        foreach ($combos as $index => $combo) {
            $sku = $skuPrefix.'-'.$combo['suffix'];
            $variantItemId = $this->upsertVariantItem([
                'product_id' => $productId,
                'unit_id' => $unitId,
                'sku' => $sku,
                'name' => $combo['color'].' / '.$combo['storage'],
                'buying_price' => $basePrice - 1200000 + $combo['extra'],
                'selling_price' => $basePrice + $combo['extra'],
            ]);

            $this->attachVariantOption($variantItemId, $optionIds['Color'][$combo['color']]);
            $this->attachVariantOption($variantItemId, $optionIds['Storage'][$combo['storage']]);

            $this->upsertStockUnit([
                'product_id' => $productId,
                'product_variant_id' => $variantItemId,
                'imei_serial_number' => 'IMEI-'.$sku.'-01',
                'barcode' => 'BC-'.$sku.'-01',
                'status' => 'available',
                'note' => 'Seeded sample stock unit #'.($index + 1),
            ]);
        }
    }

    private function seedMacbookVariants(string $productId, string $skuPrefix, ?string $unitId, float $basePrice): void
    {
        $variants = [
            'Color' => ['Midnight', 'Silver'],
            'RAM' => ['8GB', '16GB'],
            'Storage' => ['256GB', '512GB'],
        ];

        $variantIds = $this->upsertVariantDimensions($productId, $variants);
        $optionIds = $this->upsertVariantOptions($variantIds, $variants);

        $combos = [
            ['color' => 'Midnight', 'ram' => '8GB', 'storage' => '256GB', 'suffix' => 'MID-8-256', 'extra' => 0],
            ['color' => 'Midnight', 'ram' => '16GB', 'storage' => '512GB', 'suffix' => 'MID-16-512', 'extra' => 5000000],
            ['color' => 'Silver', 'ram' => '8GB', 'storage' => '256GB', 'suffix' => 'SLV-8-256', 'extra' => 0],
            ['color' => 'Silver', 'ram' => '16GB', 'storage' => '512GB', 'suffix' => 'SLV-16-512', 'extra' => 5000000],
        ];

        foreach ($combos as $index => $combo) {
            $sku = $skuPrefix.'-'.$combo['suffix'];
            $variantItemId = $this->upsertVariantItem([
                'product_id' => $productId,
                'unit_id' => $unitId,
                'sku' => $sku,
                'name' => $combo['color'].' / '.$combo['ram'].' / '.$combo['storage'],
                'buying_price' => $basePrice - 1800000 + $combo['extra'],
                'selling_price' => $basePrice + $combo['extra'],
            ]);

            $this->attachVariantOption($variantItemId, $optionIds['Color'][$combo['color']]);
            $this->attachVariantOption($variantItemId, $optionIds['RAM'][$combo['ram']]);
            $this->attachVariantOption($variantItemId, $optionIds['Storage'][$combo['storage']]);

            $this->upsertStockUnit([
                'product_id' => $productId,
                'product_variant_id' => $variantItemId,
                'imei_serial_number' => 'SERIAL-'.$sku.'-01',
                'barcode' => 'BC-'.$sku.'-01',
                'status' => 'available',
                'note' => 'Seeded sample stock unit #'.($index + 1),
            ]);
        }
    }

    private function seedNonVariantStockUnit(string $productId, string $skuPrefix): void
    {
        $this->upsertStockUnit([
            'product_id' => $productId,
            'product_variant_id' => null,
            'imei_serial_number' => 'IMEI-'.$skuPrefix.'-SINGLE-01',
            'barcode' => 'BC-'.$skuPrefix.'-SINGLE-01',
            'status' => 'available',
            'note' => 'Seeded non-variant stock unit',
        ]);
    }

    /**
     * @param  array<string, array<int, string>>  $variants
     * @return array<string, string>
     */
    private function upsertVariantDimensions(string $productId, array $variants): array
    {
        $result = [];
        $sortOrder = 0;

        foreach (array_keys($variants) as $name) {
            $existing = DB::table('product_variants')
                ->where('product_id', $productId)
                ->where('name', $name)
                ->first();

            if ($existing) {
                DB::table('product_variants')->where('id', $existing->id)->update([
                    'sort_order' => $sortOrder,
                    'updated_at' => now(),
                    'deleted_at' => null,
                ]);

                $result[$name] = (string) $existing->id;
            } else {
                $id = (string) Str::uuid();
                DB::table('product_variants')->insert([
                    'id' => $id,
                    'product_id' => $productId,
                    'name' => $name,
                    'sort_order' => $sortOrder,
                    'created_at' => now(),
                    'updated_at' => now(),
                    'deleted_at' => null,
                ]);

                $result[$name] = $id;
            }

            $sortOrder++;
        }

        return $result;
    }

    /**
     * @param  array<string, string>  $variantIds
     * @param  array<string, array<int, string>>  $variants
     * @return array<string, array<string, string>>
     */
    private function upsertVariantOptions(array $variantIds, array $variants): array
    {
        $result = [];

        foreach ($variants as $variantName => $values) {
            $variantId = $variantIds[$variantName];
            $result[$variantName] = [];

            foreach ($values as $index => $value) {
                $existing = DB::table('product_variant_options')
                    ->where('product_variant_id', $variantId)
                    ->where('value', $value)
                    ->first();

                if ($existing) {
                    DB::table('product_variant_options')->where('id', $existing->id)->update([
                        'sort_order' => $index,
                        'updated_at' => now(),
                    ]);

                    $result[$variantName][$value] = (string) $existing->id;

                    continue;
                }

                $id = (string) Str::uuid();
                DB::table('product_variant_options')->insert([
                    'id' => $id,
                    'product_variant_id' => $variantId,
                    'value' => $value,
                    'sort_order' => $index,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $result[$variantName][$value] = $id;
            }
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function upsertVariantItem(array $data): string
    {
        $existing = DB::table('variant_items')->where('sku', $data['sku'])->first();

        if ($existing) {
            DB::table('variant_items')->where('id', $existing->id)->update([
                'product_id' => $data['product_id'],
                'unit_id' => $data['unit_id'],
                'name' => $data['name'],
                'buying_price' => $data['buying_price'],
                'selling_price' => $data['selling_price'],
                'track_stock' => true,
                'stock' => 1,
                'min_stock_alert' => 1,
                'is_active' => true,
                'updated_at' => now(),
                'deleted_at' => null,
            ]);

            return (string) $existing->id;
        }

        $id = (string) Str::uuid();

        DB::table('variant_items')->insert([
            'id' => $id,
            'product_id' => $data['product_id'],
            'unit_id' => $data['unit_id'],
            'sku' => $data['sku'],
            'name' => $data['name'],
            'image' => null,
            'buying_price' => $data['buying_price'],
            'selling_price' => $data['selling_price'],
            'track_stock' => true,
            'stock' => 1,
            'min_stock_alert' => 1,
            'weight' => null,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
            'deleted_at' => null,
        ]);

        return $id;
    }

    private function attachVariantOption(string $variantItemId, string $optionId): void
    {
        $exists = DB::table('variant_item_options')
            ->where('variant_item_id', $variantItemId)
            ->where('product_variant_option_id', $optionId)
            ->exists();

        if ($exists) {
            return;
        }

        DB::table('variant_item_options')->insert([
            'id' => (string) Str::uuid(),
            'variant_item_id' => $variantItemId,
            'product_variant_option_id' => $optionId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function upsertStockUnit(array $data): void
    {
        $existing = DB::table('product_stock_units')
            ->where('imei_serial_number', $data['imei_serial_number'])
            ->first();

        if ($existing) {
            DB::table('product_stock_units')->where('id', $existing->id)->update([
                'product_id' => $data['product_id'],
                'product_variant_id' => $data['product_variant_id'],
                'barcode' => $data['barcode'],
                'status' => $data['status'],
                'note' => $data['note'],
                'updated_at' => now(),
                'deleted_at' => null,
            ]);

            return;
        }

        DB::table('product_stock_units')->insert([
            'id' => (string) Str::uuid(),
            'product_id' => $data['product_id'],
            'product_variant_id' => $data['product_variant_id'],
            'incoming_goods_item_id' => null,
            'imei_serial_number' => $data['imei_serial_number'],
            'barcode' => $data['barcode'],
            'status' => $data['status'],
            'note' => $data['note'],
            'created_at' => now(),
            'updated_at' => now(),
            'deleted_at' => null,
        ]);
    }
}
