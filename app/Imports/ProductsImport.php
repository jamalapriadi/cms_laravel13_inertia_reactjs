<?php

namespace App\Imports;

use App\Models\Shop\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\VariantItem;
use App\Models\Unit;
use App\Support\UniqueSlug;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProductsImport implements ToModel, WithBatchInserts, WithHeadingRow
{
    use Importable;

    public function model(array $row)
    {
        $row = array_map(fn ($value) => $value === null ? null : trim((string) $value), $row);
        $row['sku'] = isset($row['sku']) && $row['sku'] !== '' ? $row['sku'] : null;
        $row['slug'] = $row['slug'] ?? null;
        $row['thumbnail'] = $row['thumbnail'] ?? null;
        $row['description'] = $row['description'] ?? null;
        $row['meta_title'] = $row['meta_title'] ?? null;
        $row['meta_description'] = $row['meta_description'] ?? null;

        $validator = Validator::make($row, [
            'name' => ['required', 'string'],
            'condition' => ['required', Rule::in(['new', 'like_new', 'second'])],
            'base_price' => ['required', 'numeric', 'min:0'],
            'has_variant' => ['nullable'],
            'is_publish' => ['nullable'],
            'sku' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'sku'),
                function ($attribute, $value, $fail) use ($row) {
                    $isVariant = $this->normalizeBoolean($row['has_variant'] ?? false);

                    if (! $isVariant && empty($value)) {
                        $fail('SKU is required for products without variants.');

                        return;
                    }

                    if ($value && VariantItem::where('sku', $value)->exists()) {
                        $fail('The SKU has already been used by a variant item.');
                    }
                },
            ],
            'category_id' => ['nullable', 'uuid', 'exists:categories,id'],
            'category_slug' => ['nullable', 'string'],
            'category_name' => ['nullable', 'string'],
            'brand_id' => ['nullable', 'uuid', 'exists:brands,id'],
            'brand_slug' => ['nullable', 'string'],
            'brand_name' => ['nullable', 'string'],
            'unit_id' => ['nullable', 'string', 'exists:units,id'],
            'unit_code' => ['nullable', 'string'],
            'unit_name' => ['nullable', 'string'],
            'slug' => ['nullable', 'string'],
            'thumbnail' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string'],
            'meta_description' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            throw new \Exception('Invalid product row: '.implode('; ', $validator->errors()->all()));
        }

        $categoryId = $this->resolveCategoryId($row);
        $brandId = $this->resolveBrandId($row);
        $unitId = $this->resolveUnitId($row);

        if (! $categoryId) {
            throw new \Exception('Product "'.($row['name'] ?? 'unknown').'" requires a valid category_id, category_slug, or category_name.');
        }

        $slug = $row['slug'] ?: UniqueSlug::make(Product::class, $row['name']);

        $product = new Product([
            'category_id' => $categoryId,
            'brand_id' => $brandId,
            'unit_id' => $unitId,
            'name' => $row['name'],
            'slug' => UniqueSlug::make(Product::class, $slug),
            'sku' => $row['sku'] ?: null,
            'thumbnail' => $row['thumbnail'] ?: null,
            'description' => $row['description'] ?: null,
            'condition' => $row['condition'],
            'base_price' => $row['base_price'],
            'has_variant' => $this->normalizeBoolean($row['has_variant'] ?? false),
            'meta_title' => $row['meta_title'] ?: null,
            'meta_description' => $row['meta_description'] ?: null,
            'is_publish' => $this->normalizeBoolean($row['is_publish'] ?? true),
        ]);

        $product->id = (string) Str::uuid();

        return $product;
    }

    public function headingRow(): int
    {
        return 1;
    }

    public function batchSize(): int
    {
        return 100;
    }

    private function resolveCategoryId(array $row): ?string
    {
        if (! empty($row['category_id']) && Category::where('id', $row['category_id'])->exists()) {
            return $row['category_id'];
        }

        if (! empty($row['category_slug'])) {
            $category = Category::where('slug', $row['category_slug'])->first();
            if ($category) {
                return $category->id;
            }
        }

        if (! empty($row['category_name'])) {
            $category = Category::where('name', $row['category_name'])->first();
            if ($category) {
                return $category->id;
            }
        }

        return null;
    }

    private function resolveBrandId(array $row): ?string
    {
        if (! empty($row['brand_id']) && Brand::where('id', $row['brand_id'])->exists()) {
            return $row['brand_id'];
        }

        if (! empty($row['brand_slug'])) {
            $brand = Brand::where('slug', $row['brand_slug'])->first();
            if ($brand) {
                return $brand->id;
            }
        }

        if (! empty($row['brand_name'])) {
            $brand = Brand::where('name', $row['brand_name'])->first();
            if ($brand) {
                return $brand->id;
            }
        }

        return null;
    }

    private function resolveUnitId(array $row): ?string
    {
        if (! empty($row['unit_id']) && Unit::where('id', $row['unit_id'])->exists()) {
            return $row['unit_id'];
        }

        if (! empty($row['unit_code'])) {
            $unit = Unit::where('code', $row['unit_code'])->first();
            if ($unit) {
                return $unit->id;
            }
        }

        if (! empty($row['unit_name'])) {
            $unit = Unit::where('name', $row['unit_name'])->first();
            if ($unit) {
                return $unit->id;
            }
        }

        return null;
    }

    private function normalizeBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        $normalized = strtolower((string) $value);

        return in_array($normalized, ['1', 'true', 'yes', 'y', 'on'], true);
    }
}
