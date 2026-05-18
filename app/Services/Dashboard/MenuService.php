<?php

namespace App\Services\Dashboard;

use App\Models\Dashboard\Menu;
use App\Models\Dashboard\MenuItem;
use App\Models\Dashboard\MenuItemTranslation;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MenuService
{
    public function getMenuTree(string $slug)
    {
        return Menu::where('slug', $slug)
                ->with([
                    'items.children',
                    'items.translations',
                    'items.children.translations',
                ])
                ->first();
    }

    public function getMenuByLocale(string $slug, string $locale = 'ID')
    {
        $menu = $this->getMenuTree($slug);

        if (!$menu) return [];

        return $this->mapLocale($menu->items, $locale);
    }

    protected function mapLocale($items, $locale)
    {
        return $items->map(function ($item) use ($locale) {

            $translation = $item->translations
                ->firstWhere('locale', $locale);

            // 🔥 fallback ke default (id)
            if (!$translation) {
                $translation = $item->translations
                    ->firstWhere('locale', 'id');
            }

            return [
                'id' => $item->id,
                'title' => $translation?->title ?? '-',
                'url' => $translation?->url ?? $item->url,
                'target' => $item->target,
                'children' => $this->mapLocale($item->children, $locale),
            ];
        })->values();
    }

    public function buildTree($items)
    {
        return $items->map(function ($item) {

            // 🔥 ambil semua translations jadi object
            $translations = $item->translations->mapWithKeys(function ($t) {
                return [
                    $t->locale => [
                        'title' => $t->title,
                        'url' => $t->url,
                    ]
                ];
            });

            return [
                'id' => $item->id,
                'url' => $item->url,
                'target' => $item->target,
                'translations' => $translations,
                'children' => $this->buildTree($item->children),
            ];
        })->values();
    }

    public function saveTree($menuId, array $items, $parentId = null, &$allIds = [])
    {
        DB::transaction(function () use ($menuId, $items, $parentId, &$allIds) {

            foreach ($items as $index => $item) {

                $menuItem = MenuItem::updateOrCreate(
                    ['id' => is_numeric($item['id'] ?? null) ? $item['id'] : null],
                    [
                        'menu_id' => $menuId,
                        'parent_id' => $parentId,
                        'url' => $item['url'] ?? null,
                        'order' => $index,
                        'target' => $item['target'] ?? '_self',
                    ]
                );

                $allIds[] = $menuItem->id;

                // 🔥 SIMPAN TRANSLATIONS
                $existingTranslations = MenuItemTranslation::where('menu_item_id', $menuItem->id)
                    ->get()
                    ->keyBy('locale');

                foreach ($item['translations'] ?? [] as $locale => $trans) {

                    $existing = $existingTranslations[$locale] ?? null;

                    MenuItemTranslation::updateOrCreate(
                        [
                            'menu_item_id' => $menuItem->id,
                            'locale' => $locale,
                        ],
                        [
                            'title' => $trans['title'] ?? $existing?->title ?? '',
                            'url' => $trans['url'] ?? $existing?->url ?? null,
                        ]
                    );
                }

                // 🔥 CHILDREN
                if (!empty($item['children'])) {
                    $this->saveTree($menuId, $item['children'], $menuItem->id, $allIds);
                }
            }

            // 🔥 DELETE ORPHAN (hanya root)
            if ($parentId === null) {
                MenuItem::where('menu_id', $menuId)
                    ->when(!empty($allIds), fn ($q) => $q->whereNotIn('id', $allIds))
                    ->delete();

                // 🔥 CLEAR CACHE TANPA QUERY ULANG
                $menu = Menu::find($menuId);
                if ($menu) {
                    Cache::forget("menu_" . $menu->slug);
                }
            }
        });
    }

    public function validateTree(array $items, $parentId = null, $visited = [])
    {
        foreach ($items as $item) {

            // 🔥 VALIDASI TRANSLATION TITLE
            $hasTitle = collect($item['translations'] ?? [])
                ->filter(fn ($t) => !empty($t['title']))
                ->isNotEmpty();

            if (!$hasTitle) {
                throw new \Exception('Minimal satu bahasa harus memiliki title');
            }

            // 🔥 DUPLICATE / LOOP CHECK
            if (isset($item['id'])) {
                if (in_array($item['id'], $visited)) {
                    throw new \Exception("Duplicate / circular ID detected: {$item['id']}");
                }

                $visited[] = $item['id'];
            }

            // 🔥 SELF PARENT
            if (isset($item['id']) && $item['id'] == $parentId) {
                throw new \Exception("Item tidak boleh menjadi parent dirinya sendiri (ID: {$item['id']})");
            }

            // 🔥 DEPTH LIMIT
            if (count($visited) > 1000) {
                throw new \Exception('Tree terlalu dalam (kemungkinan infinite loop)');
            }

            // 🔥 RECURSIVE
            if (!empty($item['children'])) {
                $this->validateTree($item['children'], $item['id'] ?? null, $visited);
            }
        }
    }
}