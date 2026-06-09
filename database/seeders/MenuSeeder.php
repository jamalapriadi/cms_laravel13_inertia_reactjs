<?php

namespace Database\Seeders;

use App\Models\Dashboard\Menu;
use App\Models\Dashboard\MenuItem;
use App\Models\Dashboard\MenuItemTranslation;
use App\Models\Shop\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $featuredCategory = Category::query()
                ->where('is_publish', true)
                ->whereHas('products', fn ($query) => $query->where('is_publish', true))
                ->orderBy('sort_order')
                ->orderBy('name')
                ->first();

            $menu = Menu::query()->updateOrCreate(
                ['slug' => 'main-menu'],
                ['name' => 'Main Menu']
            );

            $menu->allItems()->delete();

            $items = [
                [
                    'type' => 'dropdown',
                    'target' => '_self',
                    'meta' => [
                        'dropdown_layout' => 'mega_menu',
                        'columns' => 4,
                    ],
                    'translations' => [
                        'id' => [
                            'title' => 'Produk',
                        ],
                    ],
                    'children' => [
                        [
                            'type' => 'dynamic',
                            'target' => '_self',
                            'meta' => [
                                'source' => 'products',
                                'filter' => [
                                    'category_id' => $featuredCategory?->id,
                                ],
                                'limit' => 6,
                                'sort' => 'latest',
                                'layout' => 'product_grid',
                                'show_image' => true,
                                'show_price' => true,
                                'show_excerpt' => false,
                                'cta_label' => 'Lihat Semua Produk',
                                'cta_url' => $featuredCategory
                                    ? '/products?category='.$featuredCategory->slug
                                    : '/products',
                            ],
                            'translations' => [
                                'id' => [
                                    'title' => 'Produk Pilihan',
                                ],
                            ],
                        ],
                        [
                            'type' => 'category',
                            'target' => '_self',
                            'url' => $featuredCategory ? '/products?category='.$featuredCategory->slug : '/products',
                            'translations' => [
                                'id' => [
                                    'title' => $featuredCategory?->name ?? 'Kategori Produk',
                                ],
                            ],
                        ],
                    ],
                ],
                [
                    'type' => 'custom',
                    'target' => '_self',
                    'url' => '/tentang-kami',
                    'translations' => [
                        'id' => [
                            'title' => 'Tentang Kami',
                        ],
                    ],
                ],
                [
                    'type' => 'custom',
                    'target' => '_self',
                    'url' => '/blog',
                    'translations' => [
                        'id' => [
                            'title' => 'Blog',
                        ],
                    ],
                ],
                [
                    'type' => 'custom',
                    'target' => '_self',
                    'url' => '/kontak',
                    'translations' => [
                        'id' => [
                            'title' => 'Kontak',
                        ],
                    ],
                ],
            ];

            $this->createTree($menu->id, $items);
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    private function createTree(int $menuId, array $items, ?int $parentId = null): void
    {
        foreach ($items as $index => $item) {
            $menuItem = MenuItem::query()->create([
                'menu_id' => $menuId,
                'parent_id' => $parentId,
                'url' => $item['url'] ?? null,
                'type' => $item['type'] ?? 'custom',
                'order' => $index,
                'target' => $item['target'] ?? '_self',
                'icon' => $item['icon'] ?? null,
                'meta' => $item['meta'] ?? null,
            ]);

            foreach ($item['translations'] ?? [] as $locale => $translation) {
                MenuItemTranslation::query()->create([
                    'menu_item_id' => $menuItem->id,
                    'locale' => $locale,
                    'title' => $translation['title'] ?? 'Menu Item',
                    'url' => $translation['url'] ?? null,
                ]);
            }

            if (! empty($item['children'])) {
                $this->createTree($menuId, $item['children'], $menuItem->id);
            }
        }
    }
}
