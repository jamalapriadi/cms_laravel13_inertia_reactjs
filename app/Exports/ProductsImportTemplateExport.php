<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProductsImportTemplateExport implements FromArray, ShouldAutoSize, WithHeadings
{
    public function array(): array
    {
        return [
            [
                'name' => 'iPhone 15',
                'slug' => 'iphone-15',
                'sku' => 'IPH15-BASE',
                'category_id' => '',
                'category_slug' => 'phones',
                'category_name' => 'Phones',
                'brand_id' => '',
                'brand_slug' => 'apple',
                'brand_name' => 'Apple',
                'unit_id' => '',
                'unit_code' => 'pcs',
                'unit_name' => 'Piece',
                'condition' => 'new',
                'base_price' => '15000000',
                'has_variant' => '0',
                'is_publish' => '1',
                'thumbnail' => 'media/2026/05/catalog.webp',
                'description' => 'Contoh deskripsi produk',
                'meta_title' => 'iPhone 15',
                'meta_description' => 'Contoh template import produk',
            ],
        ];
    }

    public function headings(): array
    {
        return [
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
        ];
    }
}
