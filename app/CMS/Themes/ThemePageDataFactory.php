<?php

namespace App\CMS\Themes;

use App\Http\Resources\Api\V1\BannerSlideResource;
use App\Http\Resources\Api\V1\CategoryDetailResource;
use App\Http\Resources\Api\V1\EcommerceCategoryResource;
use App\Http\Resources\Api\V1\PageDetailResource;
use App\Http\Resources\Api\V1\ProductDetailResource;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Dashboard\Menu;
use App\Models\Dashboard\Option;
use App\Models\Shop\BannerSlide;
use App\Models\Shop\Category;
use App\Services\ActiveLanguageService;
use App\Services\Api\V1\PageService;
use App\Services\Api\V1\ProductCatalogService;
use App\Services\Dashboard\MenuService;
use App\Services\SiteContentService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Throwable;

class ThemePageDataFactory
{
    public function __construct(
        private readonly ProductCatalogService $productCatalogService,
        private readonly ActiveLanguageService $activeLanguageService,
        private readonly SiteContentService $siteContentService,
        private readonly MenuService $menuService,
        private readonly PageService $pageService,
        private readonly FallbackAdminLoginViewData $fallbackAdminLoginViewData,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function home(Request $request): array
    {
        [$locale, $fallbackLocale] = $this->resolveLocales($request);

        return array_merge($this->shared($locale, $fallbackLocale), [
            'bannerSlides' => $this->bannerSlides($request),
            'categories' => $this->homepageCategories($request),
            'featuredProducts' => $this->products($request, 'best_selling', 8),
            'latestProducts' => $this->products($request, 'latest', 8),
            'contents' => $this->homepageContents($locale, $fallbackLocale),
            'fallbackLogin' => $this->fallbackAdminLoginViewData->data(),
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function page(Request $request, string $slug): ?array
    {
        [$locale, $fallbackLocale] = $this->resolveLocales($request);

        try {
            $page = $this->pageService->findPublishedBySlug($slug, $locale);

            if (! $page) {
                return null;
            }

            return array_merge($this->shared($locale, $fallbackLocale), [
                'page' => PageDetailResource::make($page)->resolve($request),
            ]);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function productIndex(Request $request, array $filters): array
    {
        [$locale, $fallbackLocale] = $this->resolveLocales($request);

        try {
            $payload = $this->productCatalogService->paginateForFilters($filters, $request);

            return array_merge($this->shared($locale, $fallbackLocale), [
                'products' => $payload['data'],
                'pagination' => $payload['meta'],
                'filters' => $filters,
            ]);
        } catch (Throwable) {
            return array_merge($this->shared($locale, $fallbackLocale), [
                'products' => [],
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => 0,
                    'total' => 0,
                    'last_page' => 1,
                ],
                'filters' => $filters,
            ]);
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    public function productShow(Request $request, string $slug): ?array
    {
        [$locale, $fallbackLocale] = $this->resolveLocales($request);

        try {
            $product = $this->productCatalogService->baseQuery()
                ->with([
                    'unit',
                    'images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order')->latest(),
                    'specifications' => fn ($query) => $query->latest(),
                    'variants.options',
                    'variantItems.options.variant',
                ])
                ->where('slug', $slug)
                ->first();

            if (! $product) {
                return null;
            }

            return array_merge($this->shared($locale, $fallbackLocale), [
                'product' => ProductDetailResource::make($product)->resolve($request),
                'relatedProducts' => $this->relatedProducts($request, $product->category_id, $product->id),
            ]);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    public function categoryShow(Request $request, string $slug, array $filters): ?array
    {
        [$locale, $fallbackLocale] = $this->resolveLocales($request);

        try {
            $category = Category::query()
                ->where('is_publish', true)
                ->with([
                    'parent' => fn ($query) => $query
                        ->where('is_publish', true)
                        ->with([
                            'children' => fn ($childQuery) => $childQuery
                                ->where('is_publish', true)
                                ->orderBy('sort_order')
                                ->orderBy('name'),
                        ]),
                    'children' => fn ($query) => $query
                        ->where('is_publish', true)
                        ->orderBy('sort_order')
                        ->orderBy('name'),
                ])
                ->where('slug', $slug)
                ->first();

            if (! $category) {
                return null;
            }

            $products = $this->productCatalogService->paginateForFilters(
                $filters,
                $request,
                ['category_ids' => $this->categoryIdsForListing($category)]
            );

            return array_merge($this->shared($locale, $fallbackLocale), [
                'category' => CategoryDetailResource::make($category)->resolve($request),
                'products' => $products['data'],
                'pagination' => $products['meta'],
                'filters' => $filters,
            ]);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function shared(string $locale, string $fallbackLocale): array
    {
        return [
            'locale' => $locale,
            'fallbackLocale' => $fallbackLocale,
            'menus' => $this->menus($locale),
            'siteSettings' => $this->siteSettings(),
        ];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function resolveLocales(Request $request): array
    {
        $defaultLocale = strtolower((string) config('app.fallback_locale', 'en'));

        try {
            $requestedLocale = (string) $request->query(
                'locale',
                $request->session()->get('locale', app()->getLocale()),
            );
            $fallbackLocale = $this->activeLanguageService->defaultCode();

            return [
                $this->activeLanguageService->resolveLocale($requestedLocale),
                $fallbackLocale,
            ];
        } catch (Throwable) {
            return [$defaultLocale, $defaultLocale];
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function siteSettings(): array
    {
        try {
            return Option::query()->get(['key', 'value'])
                ->mapWithKeys(fn (Option $option): array => [$option->key => $option->value])
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    private function menus(string $locale): array
    {
        try {
            return Menu::query()
                ->orderBy('name')
                ->get(['slug'])
                ->mapWithKeys(fn (Menu $menu): array => [
                    $menu->slug => $this->menuService->getMenuByLocale($menu->slug, $locale),
                ])
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function bannerSlides(Request $request): array
    {
        try {
            $slides = BannerSlide::query()
                ->active()
                ->homepageMain()
                ->orderBy('sort_order')
                ->latest('created_at')
                ->limit(3)
                ->get();

            return BannerSlideResource::collection($slides)->resolve($request);
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function homepageCategories(Request $request): array
    {
        try {
            $categories = Category::query()
                ->where('is_publish', true)
                ->whereHas('products', fn (Builder $productQuery) => $this->productCatalogService->constrainPublicVisibility($productQuery))
                ->withCount([
                    'products' => fn (Builder $productQuery) => $this->productCatalogService->constrainPublicVisibility($productQuery),
                ])
                ->orderByDesc('show_home')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->limit(8)
                ->get();

            return EcommerceCategoryResource::collection($categories)->resolve($request);
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function products(Request $request, string $sort, int $limit): array
    {
        try {
            $products = $this->productCatalogService
                ->buildListingQuery(['sort' => $sort])
                ->limit($limit)
                ->get();

            return ProductResource::collection($products)->resolve($request);
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function relatedProducts(Request $request, ?string $categoryId, string $ignoreProductId): array
    {
        try {
            $query = $this->productCatalogService->baseQuery()
                ->whereKeyNot($ignoreProductId)
                ->limit(4);

            if ($categoryId) {
                $query->where('products.category_id', $categoryId);
            }

            return ProductResource::collection($query->get())->resolve($request);
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @return array<string, string|null>
     */
    private function homepageContents(string $locale, string $fallbackLocale): array
    {
        try {
            return $this->siteContentService->getByKeys([
                'homepage.hero.eyebrow',
                'homepage.hero.title',
                'homepage.hero.subtitle',
                'homepage.hero.button_primary',
                'homepage.hero.button_secondary',
                'homepage.best_seller.title',
                'homepage.best_seller.description',
                'footer.description',
            ], $locale, $fallbackLocale);
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @return list<string>
     */
    private function categoryIdsForListing(Category $category): array
    {
        $categories = Category::query()
            ->where('is_publish', true)
            ->get(['id', 'parent_id']);

        return [
            $category->id,
            ...$this->descendantCategoryIds($category->id, $categories),
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Category>  $categories
     * @return list<string>
     */
    private function descendantCategoryIds(string $parentId, \Illuminate\Support\Collection $categories): array
    {
        return $categories
            ->where('parent_id', $parentId)
            ->flatMap(fn (Category $child) => [
                $child->id,
                ...$this->descendantCategoryIds($child->id, $categories),
            ])
            ->values()
            ->all();
    }
}
