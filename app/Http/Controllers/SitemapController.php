<?php

namespace App\Http\Controllers;

use App\CMS\Sitemap\SitemapManager;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    public function __construct(
        private readonly SitemapManager $sitemapManager
    ) {}

    /**
     * Render the main sitemap.xml.
     */
    public function index(): Response
    {
        if (! config('cms_sitemap.enabled')) {
            abort(404);
        }

        $useCache = config('cms_sitemap.use_cache', true);
        $ttl = config('cms_sitemap.cache_ttl');

        $xml = $useCache
            ? Cache::remember('cms.sitemap.index', $ttl, fn () => $this->generateMainSitemap())
            : $this->generateMainSitemap();

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }

    /**
     * Render a sub-sitemap (e.g. /sitemaps/pages.xml).
     */
    public function show(string $type): Response
    {
        if (! config('cms_sitemap.enabled') || ! config('cms_sitemap.sitemap_index')) {
            abort(404);
        }

        $allowedTypes = ['pages', 'posts', 'products', 'categories', 'brands', 'collections'];
        if (! in_array($type, $allowedTypes) || ! config("cms_sitemap.include.{$type}")) {
            abort(404);
        }

        $useCache = config('cms_sitemap.use_cache', true);
        $ttl = config('cms_sitemap.cache_ttl');

        $xml = $useCache
            ? Cache::remember("cms.sitemap.{$type}", $ttl, fn () => $this->sitemapManager->generateUrlSet($type))
            : $this->sitemapManager->generateUrlSet($type);

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }

    /**
     * Helper to generate sitemap index or flat list.
     */
    private function generateMainSitemap(): string
    {
        return config('cms_sitemap.sitemap_index')
            ? $this->sitemapManager->generateIndex()
            : $this->sitemapManager->generateFlatSitemap();
    }
}
