<?php

namespace App\Http\Resources\Api\V1;

use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PreferenceOptionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'theme' => [
                'default_mode' => $this->castValue($this->getValue('preferences_theme_default_mode'), 'string', 'light'),
                'primary_color' => $this->castValue($this->getValue('preferences_primary_color'), 'string', '#10b981'),
                'secondary_color' => $this->castValue($this->getValue('preferences_secondary_color'), 'string', '#111827'),
            ],
            'layout' => [
                'container_width' => $this->castValue($this->getValue('preferences_container_width'), 'string', 'default'),
                'enable_breadcrumb' => $this->castValue($this->getValue('preferences_enable_breadcrumb'), 'bool', true),
                'enable_sticky_header' => $this->castValue($this->getValue('preferences_enable_sticky_header'), 'bool', true),
            ],
            'display' => [
                'show_product_rating' => $this->castValue($this->getValue('preferences_show_product_rating'), 'bool', true),
                'show_product_stock' => $this->castValue($this->getValue('preferences_show_product_stock'), 'bool', true),
                'show_product_sku' => $this->castValue($this->getValue('preferences_show_product_sku'), 'bool', true),
                'show_blog_author' => $this->castValue($this->getValue('preferences_show_blog_author'), 'bool', true),
                'show_blog_date' => $this->castValue($this->getValue('preferences_show_blog_date'), 'bool', true),
            ],
            'currency' => [
                'code' => $this->castValue($this->getValue('preferences_currency_code'), 'string', 'JPY'),
                'symbol' => $this->castValue($this->getValue('preferences_currency_symbol'), 'string', '¥'),
                'position' => $this->castValue($this->getValue('preferences_currency_position'), 'string', 'before'),
            ],
            'locale' => [
                'default_language' => $this->castValue($this->getValue('preferences_default_language'), 'string', 'en'),
                'timezone' => $this->castValue($this->getValue('preferences_timezone'), 'string', 'Asia/Tokyo'),
            ],
            'seo' => [
                'meta_keywords' => $this->getValue('meta_keyword'),
                'meta_description' => $this->getValue('meta_description'),
            ],
            'snippets' => [
                'robot_txt' => $this->getValue('robot_txt'),
                'head' => $this->getValue('code_snippet_head'),
                'body' => $this->getValue('code_snippet_body'),
                'footer' => $this->getValue('code_snippet_footer'),
            ],
            'social_sharing_image' => $this->mediaUrl($this->getValue('social_sharing_image')),
            'email_recipient' => $this->getValue('email_recipient'),
        ];
    }

    private function getValue(string $key, mixed $default = null): mixed
    {
        return $this->resource->get($key)?->value ?? $default;
    }

    private function castValue(mixed $value, string $type = 'string', mixed $default = null): mixed
    {
        if ($value === null) {
            return $default;
        }

        return match ($type) {
            'bool', 'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default,
            'int', 'integer' => is_numeric($value) ? (int) $value : $default,
            'float', 'double' => is_numeric($value) ? (float) $value : $default,
            default => (string) $value,
        };
    }

    private function mediaUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return MediaPath::url($path);
    }
}
