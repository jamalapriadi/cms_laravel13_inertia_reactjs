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
                ])
                ->first();
    }

    public function getMenuByLocale(string $slug, string $locale = 'ID')
    {
        $locale = strtolower($locale);
        $menu = $this->getMenuTree($slug);

        if (!$menu) return [];

        return $this->mapLocale($menu->items, $locale);
    }

    protected function mapLocale($items, $locale)
    {
        return $items->map(function ($item) use ($locale) {

            $translation = $item->translations
                ->firstWhere('locale', $locale);

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
                $menuItem = null;

                if (is_numeric($item['id'] ?? null)) {
                    $menuItem = MenuItem::where('menu_id', $menuId)
                        ->find($item['id']);
                }

                if ($menuItem) {
                    $menuItem->update([
                        'menu_id' => $menuId,
                        'parent_id' => $parentId,
                        'url' => $item['url'] ?? null,
                        'type' => $item['type'] ?? 'custom',
                        'order' => $index,
                        'target' => $item['target'] ?? '_self',
                        'icon' => $item['icon'] ?? null,
                        'meta' => $item['meta'] ?? null,
                    ]);
                } else {
                    $menuItem = MenuItem::create([
                        'menu_id' => $menuId,
                        'parent_id' => $parentId,
                        'url' => $item['url'] ?? null,
                        'type' => $item['type'] ?? 'custom',
                        'order' => $index,
                        'target' => $item['target'] ?? '_self',
                        'icon' => $item['icon'] ?? null,
                        'meta' => $item['meta'] ?? null,
                    ]);
                }

                $allIds[] = $menuItem->id;

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
                            'title' => trim($trans['title'] ?? $existing?->title ?? ''),
                            'url' => $trans['url'] ?? $existing?->url ?? null,
                        ]
                    );
                }

                if (!empty($item['children'])) {
                    $this->saveTree($menuId, $item['children'], $menuItem->id, $allIds);
                }
            }

            if ($parentId === null) {
                MenuItem::where('menu_id', $menuId)
                    ->when(!empty($allIds), fn ($q) => $q->whereNotIn('id', $allIds))
                    ->delete();

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

            $hasTitle = collect($item['translations'] ?? [])
                ->filter(fn ($t) => !empty($t['title']))
                ->isNotEmpty();

            if (!$hasTitle) {
                throw new \Exception('Minimal satu bahasa harus memiliki title');
            }

            if (isset($item['id'])) {
                if (in_array($item['id'], $visited)) {
                    throw new \Exception("Duplicate / circular ID detected: {$item['id']}");
                }

                $visited[] = $item['id'];
            }

            if (isset($item['id']) && $item['id'] == $parentId) {
                throw new \Exception("Item tidak boleh menjadi parent dirinya sendiri (ID: {$item['id']})");
            }

            if (count($visited) > 1000) {
                throw new \Exception('Tree terlalu dalam (kemungkinan infinite loop)');
            }

            if (!empty($item['children'])) {
                $this->validateTree($item['children'], $item['id'] ?? null, $visited);
            }
        }
    }
}
