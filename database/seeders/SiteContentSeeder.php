<?php

namespace Database\Seeders;

use App\Models\Shop\SiteContent;
use App\Models\Shop\SiteContentTranslation;
use App\Services\ActiveLanguageService;
use Illuminate\Database\Seeder;

class SiteContentSeeder extends Seeder
{
    public function run(): void
    {
        $languageService = app(ActiveLanguageService::class);
        $activeLocales = $languageService->activeCodes();
        $defaultLocale = $languageService->defaultCode();

        $defaults = [
            ['key' => 'homepage.hero.eyebrow', 'group' => 'homepage', 'type' => 'text', 'sort_order' => 1, 'default' => 'Smart Ecommerce Deals'],
            ['key' => 'homepage.hero.title', 'group' => 'homepage', 'type' => 'text', 'sort_order' => 2, 'default' => 'Good for Your Wallet, Smart Choice in Japan'],
            ['key' => 'homepage.hero.subtitle', 'group' => 'homepage', 'type' => 'textarea', 'sort_order' => 3, 'default' => 'Better Prices. Authentic Devices. Guaranteed Performance.'],
            ['key' => 'homepage.hero.button_primary', 'group' => 'homepage', 'type' => 'text', 'sort_order' => 4, 'default' => 'Shop Now'],
            ['key' => 'homepage.hero.button_secondary', 'group' => 'homepage', 'type' => 'text', 'sort_order' => 5, 'default' => 'View Deals'],
            ['key' => 'homepage.best_seller.title', 'group' => 'homepage', 'type' => 'text', 'sort_order' => 6, 'default' => 'Best Seller'],
            ['key' => 'homepage.best_seller.description', 'group' => 'homepage', 'type' => 'textarea', 'sort_order' => 7, 'default' => 'Discover our most popular products loved by customers.'],
            ['key' => 'homepage.exclusive_deals.title', 'group' => 'homepage', 'type' => 'text', 'sort_order' => 8, 'default' => 'Exclusive Deals'],
            ['key' => 'homepage.exclusive_deals.description', 'group' => 'homepage', 'type' => 'textarea', 'sort_order' => 9, 'default' => 'Special offers available for a limited time.'],
            ['key' => 'homepage.big_sale.title', 'group' => 'homepage', 'type' => 'text', 'sort_order' => 10, 'default' => 'Big Sale'],
            ['key' => 'homepage.big_sale.description', 'group' => 'homepage', 'type' => 'textarea', 'sort_order' => 11, 'default' => 'Save more with our biggest discounts.'],
            ['key' => 'homepage.faq.title', 'group' => 'homepage', 'type' => 'text', 'sort_order' => 12, 'default' => 'Frequently Asked Questions'],
            ['key' => 'homepage.faq.description', 'group' => 'homepage', 'type' => 'textarea', 'sort_order' => 13, 'default' => 'Find answers to common questions before shopping.'],
            ['key' => 'footer.description', 'group' => 'footer', 'type' => 'textarea', 'sort_order' => 14, 'default' => 'Authentic products, better prices, and reliable service.'],
        ];

        foreach ($defaults as $row) {
            $content = SiteContent::updateOrCreate(
                ['key' => $row['key']],
                [
                    'group' => $row['group'],
                    'type' => $row['type'],
                    'is_active' => true,
                    'sort_order' => $row['sort_order'],
                ],
            );

            foreach ($activeLocales as $locale) {
                $translation = SiteContentTranslation::firstOrNew([
                    'site_content_id' => $content->id,
                    'locale' => $locale,
                ]);

                if (filled($translation->value)) {
                    continue;
                }

                $useDefaultText = $locale === 'en' || (! in_array('en', $activeLocales, true) && $locale === $defaultLocale);

                $translation->value = $useDefaultText ? $row['default'] : ($translation->value ?? null);
                $translation->save();
            }
        }
    }
}
