<?php

namespace Database\Seeders;

use App\Models\Shop\ProductCollection;
use Illuminate\Database\Seeder;

class ProductCollectionSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            [
                'name' => 'Best Seller',
                'slug' => 'best-seller',
                'type' => 'best_seller',
                'show_home' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Exclusive Deals',
                'slug' => 'exclusive-deals',
                'type' => 'exclusive_deals',
                'show_home' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Big Sale',
                'slug' => 'big-sale',
                'type' => 'big_sale',
                'show_home' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Flash Sale',
                'slug' => 'flash-sale',
                'type' => 'flash_sale',
                'show_home' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Promo Lainnya',
                'slug' => 'promo-lainnya',
                'type' => 'promo',
                'show_home' => true,
                'sort_order' => 5,
            ],
        ];

        foreach ($defaults as $collection) {
            ProductCollection::updateOrCreate(
                ['slug' => $collection['slug']],
                [
                    'name' => $collection['name'],
                    'type' => $collection['type'],
                    'show_home' => $collection['show_home'],
                    'is_active' => true,
                    'sort_order' => $collection['sort_order'],
                ],
            );
        }
    }
}
