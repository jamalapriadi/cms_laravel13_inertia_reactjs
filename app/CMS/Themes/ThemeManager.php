<?php

namespace App\CMS\Themes;

use App\Models\Theme;
use App\Models\ThemeSetting;
use Illuminate\Contracts\View\View as ViewContract;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\View;
use Throwable;

class ThemeManager
{
    public function __construct(
        private readonly FallbackThemeResolver $fallbackThemeResolver,
    ) {}

    private ?Theme $activeTheme = null;

    private ?Theme $runtimeTheme = null;

    /**
     * @var array<int, array<string, mixed>>
     */
    private array $settingsCache = [];

    public function active(): ?Theme
    {
        if ($this->runtimeTheme instanceof Theme) {
            if ($this->isUsableTheme($this->runtimeTheme)) {
                return $this->runtimeTheme;
            }

            $this->runtimeTheme = null;
        }

        if (! $this->databaseReady()) {
            return $this->resolveFallbackTheme();
        }

        if ($this->activeTheme instanceof Theme) {
            if ($this->isUsableTheme($this->activeTheme)) {
                return $this->activeTheme;
            }

            $this->activeTheme = null;
        }

        $themeId = Cache::rememberForever(
            config('themes.cache.active_theme_id'),
            fn (): ?int => Theme::query()->where('is_active', true)->value('id')
        );

        if (! $themeId) {
            return $this->resolveFallbackTheme();
        }

        $theme = Theme::query()->find($themeId);

        if (! $theme || ! $this->isUsableTheme($theme)) {
            return $this->resolveFallbackTheme();
        }

        $this->registerThemeViews($theme);

        return $this->activeTheme = $theme;
    }

    /**
     * @return array<string, mixed>
     */
    public function manifest(?Theme $theme = null): array
    {
        $resolvedTheme = $this->resolveTheme($theme);

        if (! $resolvedTheme || ! is_array($resolvedTheme->manifest)) {
            return $this->emptyManifest();
        }

        return array_replace_recursive($this->emptyManifest(), $resolvedTheme->manifest);
    }

    public function template(string $key, ?string $fallback = null): ?string
    {
        foreach ($this->templateResolutionPlan($key) as [$theme, $candidate]) {
            $template = $this->manifestTemplate($theme, $candidate);

            if (is_string($template) && View::exists($template)) {
                return $template;
            }
        }

        foreach ($this->fallbackViewCandidates($key, $fallback) as $fallbackView) {
            if (View::exists($fallbackView)) {
                return $fallbackView;
            }
        }

        return null;
    }

    public function render(string $templateKey, array $data = [], ?string $fallback = null): ViewContract
    {
        $view = $this->template($templateKey, $fallback)
            ?? $this->fallbackView('fallback')
            ?? 'cms.fallback';
        $theme = $this->active();

        return view($view, array_merge($data, [
            'activeTheme' => $theme,
            'themeManifest' => $this->manifest($theme),
            'fallbackTemplateKey' => $templateKey,
        ]));
    }

    public function asset(string $path): string
    {
        $theme = $this->active();

        if (! $theme) {
            return '';
        }

        $normalizedPath = trim($path, '/');

        if ($normalizedPath === '') {
            return '';
        }

        $fullPath = $this->publicThemePath($theme, $normalizedPath);

        if (! File::exists($fullPath)) {
            return '';
        }

        return asset(trim(config('themes.public_url_prefix'), '/')."/{$theme->slug}/{$normalizedPath}");
    }

    /**
     * @return list<string>
     */
    public function assets(string $type = 'css'): array
    {
        $theme = $this->active();

        if (! $theme) {
            return [];
        }

        $assets = Arr::get($this->manifest($theme), "assets.{$type}", []);

        if (! is_array($assets)) {
            return [];
        }

        return collect($assets)
            ->filter(fn (mixed $asset): bool => is_string($asset) && $asset !== '')
            ->filter(fn (string $asset): bool => File::exists($this->publicThemePath($theme, trim($asset, '/'))))
            ->values()
            ->all();
    }

    public function setting(string $key, mixed $default = null): mixed
    {
        $theme = $this->active();

        if (! $theme) {
            return $default;
        }

        $settings = $this->themeSettings($theme);

        if (array_key_exists($key, $settings)) {
            return $settings[$key];
        }

        return Arr::get($this->manifest($theme), "settings.{$key}.default", $default);
    }

    public function registerActiveThemeViews(): void
    {
        $theme = $this->active();

        if (! $theme) {
            return;
        }

        $this->registerThemeViews($theme);
    }

    public function registerThemeViews(Theme $theme): void
    {
        $viewPath = $this->themeBasePath($theme).DIRECTORY_SEPARATOR.'resources'.DIRECTORY_SEPARATOR.'views';

        if (! File::isDirectory($viewPath)) {
            return;
        }

        View::replaceNamespace($theme->slug, [$viewPath]);
    }

    public function useTheme(?Theme $theme): void
    {
        $this->runtimeTheme = $theme;

        if ($theme instanceof Theme) {
            $this->registerThemeViews($theme);
        }
    }

    public function clearCache(): void
    {
        Cache::forget(config('themes.cache.active_theme_id'));
        $this->activeTheme = null;
        $this->runtimeTheme = null;
        $this->settingsCache = [];
        $this->fallbackThemeResolver->forget();
    }

    public function fallbackView(string $key): ?string
    {
        $view = config("themes.fallback_views.{$key}");

        return is_string($view) && View::exists($view) ? $view : null;
    }

    private function configuredFallbackTheme(): ?Theme
    {
        $theme = $this->fallbackThemeResolver->resolve();

        if (! $theme || ! $this->isUsableTheme($theme)) {
            return null;
        }

        $this->registerThemeViews($theme);

        return $theme;
    }

    /**
     * @return list<array{0: Theme, 1: string}>
     */
    private function templateResolutionPlan(string $key): array
    {
        $activeTheme = $this->active();
        $fallbackTheme = $this->configuredFallbackTheme();

        return collect([
            [$activeTheme, $key],
            [$activeTheme, 'fallback'],
            [$fallbackTheme, $key],
            [$fallbackTheme, 'fallback'],
            [$activeTheme, '404'],
            [$fallbackTheme, '404'],
        ])
            ->filter(fn (array $entry): bool => $entry[0] instanceof Theme && $entry[1] !== '')
            ->unique(fn (array $entry): string => $entry[0]->slug.':'.$entry[1])
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    private function fallbackViewCandidates(string $key, ?string $fallback = null): array
    {
        return collect([
            $fallback,
            config("themes.fallback_views.{$key}"),
            config('themes.fallback_views.fallback'),
        ])
            ->filter(fn (mixed $view): bool => is_string($view) && $view !== '')
            ->unique()
            ->values()
            ->all();
    }

    private function manifestTemplate(Theme $theme, string $key): ?string
    {
        $manifest = $this->manifest($theme);
        $template = Arr::get($manifest, "templates.{$key}");

        return is_string($template) ? $template : null;
    }

    private function databaseReady(): bool
    {
        try {
            return Schema::hasTable('themes');
        } catch (Throwable) {
            return false;
        }
    }

    private function isUsableTheme(Theme $theme): bool
    {
        try {
            if (! $theme->is_installed) {
                return false;
            }

            $themePath = $this->themeBasePath($theme);

            return File::isDirectory($themePath)
                && File::exists($themePath.DIRECTORY_SEPARATOR.'theme.json');
        } catch (Throwable) {
            return false;
        }
    }

    private function resolveTheme(?Theme $theme): ?Theme
    {
        return $theme ?? $this->active();
    }

    private function resolveFallbackTheme(): ?Theme
    {
        $theme = $this->fallbackThemeResolver->resolve();

        if (! $theme || ! $this->isUsableTheme($theme)) {
            return null;
        }

        $this->registerThemeViews($theme);

        return $this->activeTheme = $theme;
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyManifest(): array
    {
        return [
            'name' => null,
            'slug' => null,
            'version' => null,
            'author' => null,
            'description' => null,
            'preview' => null,
            'templates' => [],
            'assets' => [
                'css' => [],
                'js' => [],
            ],
            'settings' => [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function themeSettings(Theme $theme): array
    {
        if (array_key_exists($theme->id, $this->settingsCache)) {
            return $this->settingsCache[$theme->id];
        }

        $settings = ThemeSetting::query()
            ->where('theme_id', $theme->id)
            ->get(['key', 'value'])
            ->mapWithKeys(fn (ThemeSetting $setting): array => [$setting->key => $setting->value])
            ->all();

        return $this->settingsCache[$theme->id] = $settings;
    }

    private function themeBasePath(Theme $theme): string
    {
        return base_path($theme->path);
    }

    private function publicThemePath(Theme $theme, string $path = ''): string
    {
        $basePath = rtrim((string) config('themes.paths.public'), DIRECTORY_SEPARATOR);

        if ($path === '') {
            return $basePath.DIRECTORY_SEPARATOR.$theme->slug;
        }

        return $basePath.DIRECTORY_SEPARATOR.$theme->slug.DIRECTORY_SEPARATOR.$path;
    }
}
