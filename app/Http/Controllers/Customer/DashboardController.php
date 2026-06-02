<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\Store\BannerSlideResource;
use App\Http\Resources\Store\FaqResource;
use App\Http\Resources\Store\ProductCollectionResource;
use App\Models\Shop\BannerSlide;
use App\Models\Shop\Faq;
use App\Models\Shop\ProductCollection;
use App\Services\ActiveLanguageService;
use App\Services\SiteContentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly ActiveLanguageService $activeLanguageService,
        private readonly SiteContentService $siteContentService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $customer = $request->user('customer');
        $requestedLocale = (string) $request->query(
            'locale',
            $request->session()->get('locale', app()->getLocale()),
        );
        $locale = $this->activeLanguageService->resolveLocale($requestedLocale);
        $fallbackLocale = $this->activeLanguageService->defaultCode();

        $bannerSlides = BannerSlide::query()
            ->active()
            ->homepageMain()
            ->orderBy('sort_order')
            ->get();

        $collections = ProductCollection::query()
            ->active()
            ->showHome()
            ->withCount('items')
            ->with([
                'items' => function ($query) {
                    $query->with([
                        'product:id,name,slug,sku,base_price,thumbnail',
                        'variantItem:id,product_id,name,sku,selling_price,stock,image',
                        'variantItem.options:id,product_variant_id,value',
                        'variantItem.options.variant:id,name',
                    ])->orderBy('sort_order')->latest();
                },
            ])
            ->orderBy('sort_order')
            ->get();

        $faqs = Faq::query()
            ->active()
            ->showHome()
            ->where(function ($query) {
                $query->whereNull('position')
                    ->orWhere('position', 'homepage');
            })
            ->orderBy('sort_order')
            ->get();

        $contents = $this->siteContentService->getGroup('homepage', $locale, $fallbackLocale);

        return Inertia::render('Customer/Dashboard', [
            'customer' => [
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'last_login_at' => $customer->last_login_at?->toIso8601String(),
            ],
            'summary' => [
                'orders' => $customer->orders()->count(),
                'carts' => $customer->carts()->count(),
            ],
            'bannerSlides' => BannerSlideResource::collection($bannerSlides)->resolve(),
            'collections' => ProductCollectionResource::collection($collections)->resolve(),
            'faqs' => FaqResource::collection($faqs)->resolve(),
            'contents' => $contents,
            'locale' => $locale,
        ]);
    }
}
