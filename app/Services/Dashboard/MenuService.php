<?php

namespace App\Services\Dashboard;

use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Dashboard\Menu;
use App\Models\Dashboard\MenuItem;
use App\Models\Dashboard\MenuItemTranslation;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MenuService
{
    private const MENU_TYPES = ['custom', 'page', 'category', 'dropdown', 'dynamic'];

    private const MENU_TARGETS = ['_self', '_blank'];

    private const DYNAMIC_SOURCES = ['products', 'categories', 'pages', 'posts'];

    private const DYNAMIC_SORTS = ['latest', 'oldest', 'price_lowest', 'price_highest', 'popular'];

    private const DYNAMIC_LAYOUTS = ['product_grid', 'product_list', 'mega_menu', 'link_list'];

    private const DROPDOWN_LAYOUTS = ['dropdown', 'mega_menu'];

    public function getMenuTree(string $slug): ?Menu
    {
        return Menu::query()
                ->where('slug', $slug)
                ->with([
                    'items.translations',
                    'items.children',
                ])
                ->first();
    }

    public function getResolvedMenu(string $slug, string $locale = 'id'): ?array
    {
        $menu = $this->getMenuTree($slug);

        if (! $menu) {
            return null;
        }

        $locale = $this->normalizeLocale($locale);

        return [
            'name' => $menu->name,
            'slug' => $menu->slug,
            'items' => $this->mapLocale($menu->items, $locale),
        ];
    }

    public function getMenuByLocale(string $slug, string $locale = 'id'): array
    {
        return $this->getResolvedMenu($slug, $locale)['items'] ?? [];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function mapLocale(Collection $items, string $locale): array
    {
        return $items
            ->map(fn (MenuItem $item): array => $this->mapItem($item, $locale))
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function mapItem(MenuItem $item, string $locale): array
    {
        $translation = $this->resolveTranslation($item, $locale);
        $meta = $this->normalizeMeta($item->meta);

        $payload = [
            'id' => $item->id,
            'title' => $translation?->title ?? '-',
            'type' => $item->type,
            'url' => $translation?->url ?? $item->url,
            'target' => $item->target,
            'icon' => $item->icon,
            'meta' => empty($meta) ? (object) [] : $meta,
            'children' => $this->mapLocale($item->children, $locale),
        ];

        if ($item->type === 'dynamic') {
            $payload['items'] = $this->resolveDynamicItems($meta);
        }

        return $payload;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function buildTree(Collection $items): array
    {
        return $items
            ->map(function (MenuItem $item): array {
                $translations = $item->translations
                    ->mapWithKeys(fn (MenuItemTranslation $translation): array => [
                        strtolower($translation->locale) => [
                            'title' => $translation->title,
                            'url' => $translation->url,
                        ],
                    ])
                    ->all();

                return [
                    'id' => $item->id,
                    'url' => $item->url,
                    'type' => $item->type,
                    'target' => $item->target,
                    'icon' => $item->icon,
                    'meta' => $this->normalizeMeta($item->meta),
                    'translations' => $translations,
                    'children' => $this->buildTree($item->children),
                ];
            })
            ->values()
            ->all();
    }

    public function saveTree(int $menuId, array $items): void
    {
        DB::transaction(function () use ($menuId, $items): void {
            $allIds = [];

            $this->persistTree($menuId, $items, null, $allIds);

            MenuItem::query()
                ->where('menu_id', $menuId)
                ->when(
                    ! empty($allIds),
                    fn (Builder $query) => $query->whereNotIn('id', $allIds)
                )
                ->delete();
        });
    }

    public function validateTree(array $items, $parentId = null, array $visited = []): void
    {
        foreach ($items as $item) {
            if (! is_array($item)) {
                throw ValidationException::withMessages([
                    'items' => ['Setiap menu item harus berupa object/array yang valid.'],
                ]);
            }

            $this->validateItem($item);

            if (isset($item['id']) && $item['id'] !== null) {
                if (in_array($item['id'], $visited)) {
                    throw ValidationException::withMessages([
                        'items' => ["Duplicate / circular ID detected: {$item['id']}"],
                    ]);
                }

                $visited[] = $item['id'];
            }

            if (isset($item['id']) && $item['id'] == $parentId) {
                throw ValidationException::withMessages([
                    'items' => ["Item tidak boleh menjadi parent dirinya sendiri (ID: {$item['id']})"],
                ]);
            }

            if (count($visited) > 1000) {
                throw ValidationException::withMessages([
                    'items' => ['Tree terlalu dalam (kemungkinan infinite loop)'],
                ]);
            }

            if (! empty($item['children'])) {
                $this->validateTree($item['children'], $item['id'] ?? null, $visited);
            }
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @param  array<int, int>  $allIds
     */
    private function persistTree(int $menuId, array $items, ?int $parentId, array &$allIds): void
    {
        foreach ($items as $index => $item) {
            $menuItem = null;

            if (is_numeric($item['id'] ?? null)) {
                $menuItem = MenuItem::query()
                    ->where('menu_id', $menuId)
                    ->find((int) $item['id']);
            }

            $payload = [
                'menu_id' => $menuId,
                'parent_id' => $parentId,
                'url' => $item['url'] ?? null,
                'type' => $item['type'] ?? 'custom',
                'order' => $index,
                'target' => $item['target'] ?? '_self',
                'icon' => $item['icon'] ?? null,
                'meta' => $this->normalizeMeta($item['meta'] ?? null),
            ];

            if ($menuItem) {
                $menuItem->update($payload);
            } else {
                $menuItem = MenuItem::create($payload);
            }

            $allIds[] = $menuItem->id;

            $existingTranslations = MenuItemTranslation::query()
                ->where('menu_item_id', $menuItem->id)
                ->get()
                ->keyBy(fn (MenuItemTranslation $translation): string => strtolower($translation->locale));

            foreach ($item['translations'] ?? [] as $locale => $translation) {
                $normalizedLocale = $this->normalizeLocale($locale);
                $existing = $existingTranslations[$normalizedLocale] ?? null;

                MenuItemTranslation::updateOrCreate(
                    [
                        'menu_item_id' => $menuItem->id,
                        'locale' => $normalizedLocale,
                    ],
                    [
                        'title' => trim((string) ($translation['title'] ?? $existing?->title ?? '')),
                        'url' => $translation['url'] ?? $existing?->url ?? null,
                    ]
                );
            }

            if (! empty($item['children'])) {
                $this->persistTree($menuId, $item['children'], $menuItem->id, $allIds);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function validateItem(array $item): void
    {
        $categoryTable = (new Category)->getTable();

        $validator = Validator::make($item, [
            'id' => ['nullable'],
            'url' => ['nullable', 'string', 'max:2048'],
            'type' => ['required', 'string', Rule::in(self::MENU_TYPES)],
            'target' => ['nullable', 'string', Rule::in(self::MENU_TARGETS)],
            'icon' => ['nullable', 'string', 'max:255'],
            'meta' => ['nullable', 'array'],
            'meta.source' => ['nullable', 'string', Rule::in(self::DYNAMIC_SOURCES)],
            'meta.filter' => ['nullable', 'array'],
            'meta.filter.category_id' => ['nullable', 'uuid', "exists:{$categoryTable},id"],
            'meta.limit' => ['nullable', 'integer', 'min:1', 'max:20'],
            'meta.sort' => ['nullable', 'string', Rule::in(self::DYNAMIC_SORTS)],
            'meta.layout' => ['nullable', 'string', Rule::in(self::DYNAMIC_LAYOUTS)],
            'meta.dropdown_layout' => ['nullable', 'string', Rule::in(self::DROPDOWN_LAYOUTS)],
            'meta.columns' => ['nullable', 'integer', 'min:1', 'max:6'],
            'meta.show_image' => ['nullable', 'boolean'],
            'meta.show_price' => ['nullable', 'boolean'],
            'meta.show_excerpt' => ['nullable', 'boolean'],
            'meta.cta_label' => ['nullable', 'string', 'max:255'],
            'meta.cta_url' => ['nullable', 'string', 'max:2048'],
            'translations' => ['required', 'array', 'min:1'],
            'translations.*.title' => ['nullable', 'string', 'max:255'],
            'translations.*.url' => ['nullable', 'string', 'max:2048'],
            'children' => ['nullable', 'array'],
        ]);

        $validator->after(function ($validator) use ($item): void {
            $translations = collect($item['translations'] ?? [])
                ->filter(function ($translation): bool {
                    $title = trim((string) data_get($translation, 'title', ''));

                    return $title !== '';
                });

            if ($translations->isEmpty()) {
                $validator->errors()->add('translations', 'Minimal satu bahasa harus memiliki title');
            }

            $type = $item['type'] ?? 'custom';
            $meta = $item['meta'] ?? [];

            if ($type === 'dynamic' && empty($meta['source'])) {
                $validator->errors()->add('meta.source', 'Source wajib diisi untuk menu dynamic.');
            }

            if ($type === 'dropdown' && empty($meta['dropdown_layout'])) {
                $validator->errors()->add('meta.dropdown_layout', 'Dropdown layout wajib diisi untuk menu dropdown.');
            }
        });

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
    }

    private function resolveTranslation(MenuItem $item, string $locale): ?MenuItemTranslation
    {
        $locale = $this->normalizeLocale($locale);
        $translations = $item->translations;

        return $translations->first(fn (MenuItemTranslation $translation): bool => $this->normalizeLocale($translation->locale) === $locale)
            ?? $translations->first(fn (MenuItemTranslation $translation): bool => $this->normalizeLocale($translation->locale) === 'id')
            ?? $translations->first();
    }

    /**
     * @param  mixed  $meta
     * @return array<string, mixed>
     */
    private function normalizeMeta(mixed $meta): array
    {
        return is_array($meta) ? $meta : [];
    }

    private function normalizeLocale(string $locale): string
    {
        return strtolower(str_replace('_', '-', $locale));
    }

    /**
     * @param  array<string, mixed>  $meta
     * @return array<int, array<string, mixed>>
     */
    private function resolveDynamicItems(array $meta): array
    {
        $source = $meta['source'] ?? null;

        if ($source !== 'products') {
            return [];
        }

        $limit = max(1, min((int) ($meta['limit'] ?? 6), 20));
        $sort = (string) ($meta['sort'] ?? 'latest');
        $categoryId = data_get($meta, 'filter.category_id');

        $query = $this->dynamicProductQuery()
            ->when($categoryId, fn (Builder $builder) => $builder->where('category_id', $categoryId));

        $this->applyDynamicProductSort($query, $sort);

        $products = $query
            ->limit($limit)
            ->get();

        return collect(ProductResource::collection($products)->resolve())
            ->map(function (array $product): array {
                return [
                    'id' => $product['id'],
                    'name' => $product['name'],
                    'slug' => $product['slug'],
                    'price' => (float) ($product['final_price'] ?? $product['price'] ?? 0),
                    'image' => $product['thumbnail'] ?? null,
                    'url' => '/products/'.$product['slug'],
                ];
            })
            ->values()
            ->all();
    }

    private function dynamicProductQuery(): Builder
    {
        return Product::query()
            ->where('is_publish', true)
            ->whereHas('category', fn (Builder $categoryQuery) => $categoryQuery->where('is_publish', true))
            ->where(function (Builder $query): void {
                $query->whereNull('brand_id')
                    ->orWhereHas('brand', fn (Builder $brandQuery) => $brandQuery->where('is_active', true));
            })
            ->with([
                'category',
                'brand',
                'images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order')->latest(),
                'variantItems' => fn ($query) => $query
                    ->where('is_active', true)
                    ->with(['unit', 'options.variant'])
                    ->withCount('availableStockUnits')
                    ->orderBy('selling_price'),
            ])
            ->withCount(['availableStockUnits', 'orderItems']);
    }

    private function applyDynamicProductSort(Builder $query, string $sort): void
    {
        match ($sort) {
            'oldest' => $query->orderBy('created_at')->orderBy('id'),
            'price_lowest' => $query->orderBy('base_price')->orderByDesc('created_at'),
            'price_highest' => $query->orderByDesc('base_price')->orderByDesc('created_at'),
            'popular' => $query->orderByDesc('order_items_count')->orderByDesc('created_at'),
            default => $query->latest('created_at')->latest('id'),
        };
    }
}
