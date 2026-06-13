<?php

namespace App\Http\Controllers;

use App\Http\Resources\Api\V1\BannerSlideResource;
use App\Http\Resources\Api\V1\EcommerceCategoryResource;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Shop\BannerSlide;
use App\Models\Shop\Category;
use App\Services\ActiveLanguageService;
use App\Services\Api\V1\ProductCatalogService;
use App\Services\SiteContentService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class LandingPageController extends Controller
{
    public function __construct(
        private readonly ProductCatalogService $productCatalogService,
        private readonly ActiveLanguageService $activeLanguageService,
        private readonly SiteContentService $siteContentService,
    ) {}

    public function index(Request $request): Response
    {
        [$locale, $fallbackLocale] = $this->resolveLocales($request);

        return Inertia::render('Landing/Index', [
            'bannerSlides' => $this->bannerSlides($request),
            'categories' => $this->categories($request),
            'featuredProducts' => $this->products($request, 'best_selling'),
            'latestProducts' => $this->products($request, 'latest'),
            'contents' => $this->contents($locale, $fallbackLocale),
        ]);
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
    private function categories(Request $request): array
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
    private function products(Request $request, string $sort): array
    {
        try {
            $products = $this->productCatalogService
                ->buildListingQuery(['sort' => $sort])
                ->limit(8)
                ->get();

            return ProductResource::collection($products)->resolve($request);
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @return array<string, string|null>
     */
    private function contents(string $locale, string $fallbackLocale): array
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
}
