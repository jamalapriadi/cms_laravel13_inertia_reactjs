<?php

namespace App\Http\Resources\Api\V1;

use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GeneralOptionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $socialMedia = $this->getValue('social_media', []);
        $formattedSocialMedia = [
            'facebook' => null,
            'instagram' => null,
            'x' => null,
            'youtube' => null,
            'tiktok' => null,
        ];

        if (is_array($socialMedia)) {
            foreach ($socialMedia as $item) {
                if (isset($item['key'], $item['value']) && $item['value'] !== '') {
                    $key = strtolower(trim($item['key']));
                    $formattedSocialMedia[$key] = $item['value'];
                }
            }
        }

        $marketplace = $this->getValue('marketplace', []);
        $formattedMarketplace = [];

        if (is_array($marketplace)) {
            foreach ($marketplace as $item) {
                if (isset($item['display_name'], $item['value']) && $item['value'] !== '') {
                    $key = strtolower(str_replace(' ', '_', trim($item['display_name'])));
                    $formattedMarketplace[$key] = $item['value'];
                }
            }
        }

        return [
            'site_name' => $this->getValue('site_title', 'Gitatrading Store'),
            'site_tagline' => $this->getValue('tagline'),
            'site_description' => $this->getValue('description'),
            'site_short_description' => $this->getValue('short_description'),
            'site_logo' => $this->mediaUrl($this->getValue('logo')),
            'site_logo_footer' => $this->mediaUrl($this->getValue('logo_footer')),
            'site_logo_mobile' => $this->mediaUrl($this->getValue('logo_mobile')),
            'site_favicon' => $this->mediaUrl($this->getValue('favicon_ico')),
            'contact' => [
                'email' => $this->getValue('email_instansi'),
                'phone' => $this->getValue('phone_instansi'),
                'whatsapp' => $this->getValue('whatsapp_instansi'),
                'address' => $this->getValue('alamat_instansi'),
            ],
            'social_media' => $formattedSocialMedia,
            'marketplace' => $formattedMarketplace,
            'seo' => [
                'meta_title' => $this->getValue('site_title'),
                'meta_description' => $this->getValue('meta_description'),
                'meta_keywords' => $this->getValue('meta_keyword'),
            ],
        ];
    }

    private function getValue(string $key, mixed $default = null): mixed
    {
        return $this->resource->get($key)?->value ?? $default;
    }

    private function mediaUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return MediaPath::url($path);
    }
}
