<?php

namespace App\CMS\Sitemap;

use App\Models\Brand;
use App\Models\Dashboard\Option;
use App\Models\Page;
use App\Models\Post;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

class SitemapManager
{
    /**
     * Get the base URL for the sitemap.
     */
    public function getBaseUrl(): string
    {
        $baseUrl = null;

        if (class_exists(Option::class)) {
            try {
                $baseUrl = Option::getByKey('site_url') ?: Option::getByKey('domain');
            } catch (\Throwable $e) {
                // Fallback if table/model not migrated yet
            }
        }

        $baseUrl = $baseUrl ?: config('cms_sitemap.fallback_base_url') ?: config('app.url') ?: 'http://localhost:8000';

        return rtrim($baseUrl, '/');
    }

    /**
     * Clear all cached sitemap records.
     */
    public function clearCache(): void
    {
        Cache::forget('cms.sitemap.index');
        foreach (array_keys(config('cms_sitemap.include', [])) as $type) {
            Cache::forget("cms.sitemap.{$type}");
        }
    }

    /**
     * Generate sitemap index XML content.
     */
    public function generateIndex(): string
    {
        $baseUrl = $this->getBaseUrl();
        if ($baseUrl) {
            url()->forceRootUrl($baseUrl);
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        $types = ['pages', 'posts', 'products', 'categories', 'brands', 'collections'];

        foreach ($types as $type) {
            if (! config("cms_sitemap.include.{$type}")) {
                continue;
            }

            $urls = $this->getUrlsForType($type);
            if (empty($urls)) {
                continue;
            }

            $latestLastmod = null;
            foreach ($urls as $url) {
                if (isset($url['lastmod'])) {
                    if ($latestLastmod === null || $url['lastmod'] > $latestLastmod) {
                        $latestLastmod = $url['lastmod'];
                    }
                }
            }

            $loc = $baseUrl.'/sitemaps/'.$type.'.xml';

            $xml .= "    <sitemap>\n";
            $xml .= '        <loc>'.htmlspecialchars($loc, ENT_XML1 | ENT_QUOTES, 'UTF-8')."</loc>\n";
            if ($latestLastmod) {
                $xml .= '        <lastmod>'.htmlspecialchars($latestLastmod, ENT_XML1 | ENT_QUOTES, 'UTF-8')."</lastmod>\n";
            }
            $xml .= "    </sitemap>\n";
        }

        $xml .= '</sitemapindex>';

        return $xml;
    }

    /**
     * Generate sitemap flat list XML content.
     */
    public function generateFlatSitemap(): string
    {
        $baseUrl = $this->getBaseUrl();
        if ($baseUrl) {
            url()->forceRootUrl($baseUrl);
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        $types = ['pages', 'posts', 'products', 'categories', 'brands', 'collections'];
        $allUrls = [];

        foreach ($types as $type) {
            if (! config("cms_sitemap.include.{$type}")) {
                continue;
            }

            $allUrls = array_merge($allUrls, $this->getUrlsForType($type));
        }

        // De-duplicate by 'loc'
        $uniqueUrls = [];
        foreach ($allUrls as $url) {
            $uniqueUrls[$url['loc']] = $url;
        }

        foreach ($uniqueUrls as $url) {
            $xml .= "    <url>\n";
            $xml .= '        <loc>'.htmlspecialchars($url['loc'], ENT_XML1 | ENT_QUOTES, 'UTF-8')."</loc>\n";
            if (! empty($url['lastmod'])) {
                $xml .= '        <lastmod>'.htmlspecialchars($url['lastmod'], ENT_XML1 | ENT_QUOTES, 'UTF-8')."</lastmod>\n";
            }
            if (! empty($url['changefreq'])) {
                $xml .= '        <changefreq>'.htmlspecialchars($url['changefreq'], ENT_XML1 | ENT_QUOTES, 'UTF-8')."</changefreq>\n";
            }
            if (isset($url['priority'])) {
                $xml .= '        <priority>'.number_format($url['priority'], 1)."</priority>\n";
            }
            $xml .= "    </url>\n";
        }

        $xml .= '</urlset>';

        return $xml;
    }

    /**
     * Generate XML content for a specific sitemap type.
     */
    public function generateUrlSet(string $type): string
    {
        $baseUrl = $this->getBaseUrl();
        if ($baseUrl) {
            url()->forceRootUrl($baseUrl);
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        $urls = $this->getUrlsForType($type);

        foreach ($urls as $url) {
            $xml .= "    <url>\n";
            $xml .= '        <loc>'.htmlspecialchars($url['loc'], ENT_XML1 | ENT_QUOTES, 'UTF-8')."</loc>\n";
            if (! empty($url['lastmod'])) {
                $xml .= '        <lastmod>'.htmlspecialchars($url['lastmod'], ENT_XML1 | ENT_QUOTES, 'UTF-8')."</lastmod>\n";
            }
            if (! empty($url['changefreq'])) {
                $xml .= '        <changefreq>'.htmlspecialchars($url['changefreq'], ENT_XML1 | ENT_QUOTES, 'UTF-8')."</changefreq>\n";
            }
            if (isset($url['priority'])) {
                $xml .= '        <priority>'.number_format($url['priority'], 1)."</priority>\n";
            }
            $xml .= "    </url>\n";
        }

        $xml .= '</urlset>';

        return $xml;
    }

    /**
     * Get all URLs for a given type, including prepended index/homepage URLs.
     */
    public function getUrlsForType(string $type): array
    {
        switch ($type) {
            case 'pages':
                $urls = $this->getPageUrls();
                $homepage = [
                    'loc' => $this->getBaseUrl().'/',
                    'lastmod' => null,
                    'changefreq' => 'daily',
                    'priority' => 1.0,
                ];
                $latestPageLastmod = null;
                foreach ($urls as $u) {
                    if (isset($u['lastmod']) && ($latestPageLastmod === null || $u['lastmod'] > $latestPageLastmod)) {
                        $latestPageLastmod = $u['lastmod'];
                    }
                }
                if ($latestPageLastmod) {
                    $homepage['lastmod'] = $latestPageLastmod;
                }
                array_unshift($urls, $homepage);

                return $urls;

            case 'products':
                $urls = $this->getProductUrls();
                if (Route::has('frontend.products.index') || config('cms_sitemap.include.products')) {
                    $productsIndex = [
                        'loc' => Route::has('frontend.products.index') ? route('frontend.products.index') : $this->getBaseUrl().'/products',
                        'lastmod' => null,
                        'changefreq' => 'daily',
                        'priority' => 0.8,
                    ];
                    $latestProductLastmod = null;
                    foreach ($urls as $u) {
                        if (isset($u['lastmod']) && ($latestProductLastmod === null || $u['lastmod'] > $latestProductLastmod)) {
                            $latestProductLastmod = $u['lastmod'];
                        }
                    }
                    if ($latestProductLastmod) {
                        $productsIndex['lastmod'] = $latestProductLastmod;
                    }
                    array_unshift($urls, $productsIndex);
                }

                return $urls;

            case 'posts':
                return $this->getPostUrls();
            case 'categories':
                return $this->getCategoryUrls();
            case 'brands':
                return $this->getBrandUrls();
            case 'collections':
                return $this->getCollectionUrls();
            default:
                return [];
        }
    }

    /**
     * Retrieve public Page URLs.
     */
    public function getPageUrls(): array
    {
        if (! config('cms_sitemap.include.pages')) {
            return [];
        }
        if (! class_exists(Page::class)) {
            return [];
        }

        try {
            $pages = Page::published()->get();
            $urls = [];

            foreach ($pages as $page) {
                if (empty($page->slug)) {
                    continue;
                }
                $urls[] = [
                    'loc' => Route::has('frontend.pages.show')
                        ? route('frontend.pages.show', ['slug' => $page->slug])
                        : $this->getBaseUrl().'/'.ltrim($page->slug, '/'),
                    'lastmod' => $page->updated_at ? $page->updated_at->toIso8601String() : null,
                    'changefreq' => 'weekly',
                    'priority' => 0.7,
                ];
            }

            return $urls;
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Retrieve public Post URLs.
     */
    public function getPostUrls(): array
    {
        if (! config('cms_sitemap.include.posts')) {
            return [];
        }
        if (! class_exists(Post::class)) {
            return [];
        }

        try {
            $posts = Post::query()
                ->where('type', 'post')
                ->where('status', 'publish')
                ->where(function ($query): void {
                    $query->whereNull('published_at')
                        ->orWhere('published_at', '<=', now());
                })
                ->get();

            $urls = [];
            foreach ($posts as $post) {
                if (empty($post->slug)) {
                    continue;
                }
                $urls[] = [
                    'loc' => Route::has('frontend.posts.show')
                        ? route('frontend.posts.show', ['slug' => $post->slug])
                        : $this->getBaseUrl().'/posts/'.ltrim($post->slug, '/'),
                    'lastmod' => $post->updated_at ? $post->updated_at->toIso8601String() : null,
                    'changefreq' => 'weekly',
                    'priority' => 0.7,
                ];
            }

            return $urls;
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Retrieve public Product URLs.
     */
    public function getProductUrls(): array
    {
        if (! config('cms_sitemap.include.products')) {
            return [];
        }
        if (! class_exists(Product::class)) {
            return [];
        }

        try {
            $products = Product::query()
                ->where('is_publish', true)
                ->get();

            $urls = [];
            foreach ($products as $product) {
                if (empty($product->slug)) {
                    continue;
                }
                $urls[] = [
                    'loc' => Route::has('frontend.products.show')
                        ? route('frontend.products.show', ['slug' => $product->slug])
                        : $this->getBaseUrl().'/products/'.ltrim($product->slug, '/'),
                    'lastmod' => $product->updated_at ? $product->updated_at->toIso8601String() : null,
                    'changefreq' => 'weekly',
                    'priority' => 0.8,
                ];
            }

            return $urls;
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Retrieve public Category URLs.
     */
    public function getCategoryUrls(): array
    {
        if (! config('cms_sitemap.include.categories')) {
            return [];
        }
        if (! class_exists(Category::class)) {
            return [];
        }

        try {
            $categories = Category::query()
                ->where('is_publish', true)
                ->get();

            $urls = [];
            foreach ($categories as $category) {
                if (empty($category->slug)) {
                    continue;
                }
                $urls[] = [
                    'loc' => Route::has('frontend.categories.show')
                        ? route('frontend.categories.show', ['slug' => $category->slug])
                        : $this->getBaseUrl().'/category/'.ltrim($category->slug, '/'),
                    'lastmod' => $category->updated_at ? $category->updated_at->toIso8601String() : null,
                    'changefreq' => 'weekly',
                    'priority' => 0.8,
                ];
            }

            return $urls;
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Retrieve public Brand URLs.
     */
    public function getBrandUrls(): array
    {
        if (! config('cms_sitemap.include.brands')) {
            return [];
        }

        $brandClass = null;
        if (class_exists(\App\Models\Shop\Brand::class)) {
            $brandClass = \App\Models\Shop\Brand::class;
        } elseif (class_exists(Brand::class)) {
            $brandClass = Brand::class;
        }

        if (! $brandClass) {
            return [];
        }

        try {
            $brands = $brandClass::query()
                ->where('is_active', true)
                ->get();

            $urls = [];
            foreach ($brands as $brand) {
                if (empty($brand->slug)) {
                    continue;
                }
                $urls[] = [
                    'loc' => Route::has('frontend.brands.show')
                        ? route('frontend.brands.show', ['slug' => $brand->slug])
                        : $this->getBaseUrl().'/brand/'.ltrim($brand->slug, '/'),
                    'lastmod' => $brand->updated_at ? $brand->updated_at->toIso8601String() : null,
                    'changefreq' => 'weekly',
                    'priority' => 0.6,
                ];
            }

            return $urls;
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Retrieve public ProductCollection URLs.
     */
    public function getCollectionUrls(): array
    {
        if (! config('cms_sitemap.include.collections')) {
            return [];
        }
        if (! class_exists(ProductCollection::class)) {
            return [];
        }

        try {
            $collections = ProductCollection::active()->get();

            $urls = [];
            foreach ($collections as $collection) {
                if (empty($collection->slug)) {
                    continue;
                }
                $urls[] = [
                    'loc' => Route::has('frontend.collections.show')
                        ? route('frontend.collections.show', ['slug' => $collection->slug])
                        : $this->getBaseUrl().'/collections/'.ltrim($collection->slug, '/'),
                    'lastmod' => $collection->updated_at ? $collection->updated_at->toIso8601String() : null,
                    'changefreq' => 'weekly',
                    'priority' => 0.7,
                ];
            }

            return $urls;
        } catch (\Throwable $e) {
            return [];
        }
    }
}
