<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\GeneralOptionResource;
use App\Http\Resources\Api\V1\PreferenceOptionResource;
use App\Models\Dashboard\Option;
use App\Services\Api\V1\SiteContentApiService;
use App\Services\Cache\ListCacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OptionController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly SiteContentApiService $siteContentService
    ) {}

    /**
     * Get combined public general and preference configurations.
     */
    public function index(Request $request): JsonResponse
    {
        $data = app(ListCacheService::class)->rememberRequest('api.options.all', $request, function () use ($request): array {
            $generalAllowlist = $this->getGeneralAllowlist();
            $preferenceAllowlist = $this->getPreferenceAllowlist();
            $allAllowlist = array_merge($generalAllowlist, $preferenceAllowlist);

            $options = Option::query()
                ->whereIn('key', $allAllowlist)
                ->get()
                ->keyBy('key');

            return [
                'general' => GeneralOptionResource::make($options)->resolve($request),
                'preferences' => PreferenceOptionResource::make($options)->resolve($request),
            ];
        });

        return $this->successResponse(
            $data,
            'Website options retrieved successfully.'
        );
    }

    /**
     * Get public general website configuration.
     */
    public function general(Request $request): JsonResponse
    {
        $allowlist = $this->getGeneralAllowlist();

        $data = app(ListCacheService::class)->rememberRequest('api.options.general', $request, function () use ($allowlist, $request): array {
            $options = Option::query()
                ->whereIn('key', $allowlist)
                ->get()
                ->keyBy('key');

            return GeneralOptionResource::make($options)->resolve($request);
        });

        return $this->successResponse(
            $data,
            'General configuration retrieved successfully.'
        );
    }

    /**
     * Get public preferences website configuration.
     */
    public function preferences(Request $request): JsonResponse
    {
        $allowlist = $this->getPreferenceAllowlist();

        $data = app(ListCacheService::class)->rememberRequest('api.options.preferences', $request, function () use ($allowlist, $request): array {
            $options = Option::query()
                ->whereIn('key', $allowlist)
                ->get()
                ->keyBy('key');

            return PreferenceOptionResource::make($options)->resolve($request);
        });

        return $this->successResponse(
            $data,
            'Preferences configuration retrieved successfully.'
        );
    }

    /**
     * Get combined site configuration (general options, preferences, and site contents).
     */
    public function siteConfig(Request $request): JsonResponse
    {
        $locale = $request->query('locale') ?? $request->query('lang');

        $data = app(ListCacheService::class)->rememberRequest('api.site-config', $request, function () use ($request, $locale): array {
            $generalAllowlist = $this->getGeneralAllowlist();
            $preferenceAllowlist = $this->getPreferenceAllowlist();
            $allAllowlist = array_merge($generalAllowlist, $preferenceAllowlist);

            $options = Option::query()
                ->whereIn('key', $allAllowlist)
                ->get()
                ->keyBy('key');

            $siteContents = $this->siteContentService->getPublicContents([
                'locale' => $locale,
                'format' => 'grouped',
            ]);

            return [
                'general' => GeneralOptionResource::make($options)->resolve($request),
                'preferences' => PreferenceOptionResource::make($options)->resolve($request),
                'site_contents' => $siteContents,
            ];
        });

        return $this->successResponse(
            $data,
            'Site configuration retrieved successfully.'
        );
    }

    /**
     * Get allowlist for general configuration keys.
     *
     * @return array<int, string>
     */
    private function getGeneralAllowlist(): array
    {
        return [
            'site_title',
            'tagline',
            'description',
            'short_description',
            'logo',
            'logo_footer',
            'logo_mobile',
            'favicon_ico',
            'email_instansi',
            'phone_instansi',
            'whatsapp_instansi',
            'alamat_instansi',
            'instansi_map',
            'social_media',
            'marketplace',
            'meta_description',
            'meta_keyword',
        ];
    }

    /**
     * Get allowlist for preference configuration keys.
     *
     * @return array<int, string>
     */
    private function getPreferenceAllowlist(): array
    {
        return [
            'meta_keyword',
            'meta_description',
            'robot_txt',
            'code_snippet_head',
            'code_snippet_body',
            'code_snippet_footer',
            'email_recipient',
            'social_sharing_image',
            'preferences_theme_default_mode',
            'preferences_primary_color',
            'preferences_secondary_color',
            'preferences_container_width',
            'preferences_enable_breadcrumb',
            'preferences_enable_sticky_header',
            'preferences_show_product_rating',
            'preferences_show_product_stock',
            'preferences_show_product_sku',
            'preferences_show_blog_author',
            'preferences_show_blog_date',
            'preferences_currency_code',
            'preferences_currency_symbol',
            'preferences_currency_position',
            'preferences_default_language',
            'preferences_timezone',
        ];
    }
}
