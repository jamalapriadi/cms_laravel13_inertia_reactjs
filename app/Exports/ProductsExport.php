<?php

namespace App\Exports;

use App\Models\Shop\Product;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ProductsExport implements FromQuery, WithMapping, WithHeadings, ShouldAutoSize
{
    public function __construct(protected array $filters = [])
    {
    }

    public function query(): Builder
    {
        return Product::query()
            ->with(['category', 'brand', 'unit'])
            ->when($this->filters['search'] ?? null, function (Builder $query, $search) {
                $query->where(function (Builder $query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('meta_title', 'like', "%{$search}%")
                        ->orWhereHas('variantItems', function (Builder $query) use ($search) {
                            $query->where('sku', 'like', "%{$search}%")
                                ->orWhereHas('stockUnits', function (Builder $stockUnitQuery) use ($search) {
                                    $stockUnitQuery->where('imei_serial_number', 'like', "%{$search}%");
                                });
                        });
                });
            })
            ->when($this->filters['category_id'] ?? null, function (Builder $query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->when($this->filters['brand_id'] ?? null, function (Builder $query, $brandId) {
                $query->where('brand_id', $brandId);
            })
            ->latest();
    }

    public function map($product): array
    {
        return [
            $product->id,
            $product->name,
            $product->slug,
            $product->sku,
            $product->category_id,
            $product->category?->slug,
            $product->category?->name,
            $product->brand_id,
            $product->brand?->slug,
            $product->brand?->name,
            $product->unit_id,
            $product->unit?->code,
            $product->unit?->name,
            $product->condition,
            $product->base_price,
            $product->has_variant ? '1' : '0',
            $product->is_publish ? '1' : '0',
            $product->thumbnail,
            $product->description,
            $product->meta_title,
            $product->meta_description,
            $product->created_at?->toDateTimeString(),
            $product->updated_at?->toDateTimeString(),
        ];
    }

    public function headings(): array
    {
        return [
            'product_id',
            'name',
            'slug',
            'sku',
            'category_id',
            'category_slug',
            'category_name',
            'brand_id',
            'brand_slug',
            'brand_name',
            'unit_id',
            'unit_code',
            'unit_name',
            'condition',
            'base_price',
            'has_variant',
            'is_publish',
            'thumbnail',
            'description',
            'meta_title',
            'meta_description',
            'created_at',
            'updated_at',
        ];
    }
}
