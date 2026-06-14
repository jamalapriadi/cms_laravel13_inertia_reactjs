<?php

namespace App\CMS\Themes;

use App\Models\Theme;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

class FallbackThemeResolver
{
    /**
     * @var array<string, Theme>
     */
    private array $resolvedThemes = [];

    public function resolve(): ?Theme
    {
        foreach ($this->fallbackSlugs() as $slug) {
            $theme = $this->resolveBySlug($slug);

            if ($theme instanceof Theme) {
                return $theme;
            }
        }

        return null;
    }

    public function resolveBySlug(?string $slug): ?Theme
    {
        $slug = $this->normalizeSlug($slug);

        if ($slug === null) {
            return null;
        }

        if (array_key_exists($slug, $this->resolvedThemes)) {
            $theme = $this->resolvedThemes[$slug];

            if ($theme->exists || ! $this->databaseReady()) {
                return $theme;
            }

            unset($this->resolvedThemes[$slug]);
        }

        $rootPath = $this->themePath($slug);
        $manifest = $this->readManifest($rootPath);

        if ($manifest === null) {
            return null;
        }

        $this->publishPublicAssets($rootPath, $slug, $manifest);

        if (! $this->databaseReady()) {
            return $this->resolvedThemes[$slug] = $this->makeRuntimeTheme($slug, $manifest);
        }

        return $this->resolvedThemes[$slug] = $this->upsertThemeRecord($slug, $manifest);
    }

    public function forget(): void
    {
        $this->resolvedThemes = [];
    }

    /**
     * @return list<string>
     */
    private function fallbackSlugs(): array
    {
        return collect([
            config('themes.fallback_theme_slug'),
            config('themes.fallback_slug'),
            'default-admin-login',
            'blank-404',
            'starter-store',
        ])
            ->map(fn (mixed $slug): string => trim((string) $slug))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function normalizeSlug(?string $slug): ?string
    {
        $slug = trim((string) $slug);

        return $slug !== '' ? $slug : null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function readManifest(string $rootPath): ?array
    {
        $manifestPath = $rootPath.DIRECTORY_SEPARATOR.'theme.json';

        if (! File::isDirectory($rootPath) || ! File::exists($manifestPath)) {
            return null;
        }

        try {
            $manifest = json_decode((string) File::get($manifestPath), true);
        } catch (Throwable) {
            return null;
        }

        if (! is_array($manifest)) {
            return null;
        }

        if (($manifest['slug'] ?? null) !== basename($rootPath)) {
            return null;
        }

        return $manifest;
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    private function publishPublicAssets(string $rootPath, string $slug, array $manifest): void
    {
        $targetPath = $this->publicPath($slug);
        $sourcePublicPath = $rootPath.DIRECTORY_SEPARATOR.'public';
        $targetExists = File::isDirectory($targetPath);

        File::ensureDirectoryExists($targetPath);

        if (File::isDirectory($sourcePublicPath) && ! $targetExists) {
            File::copyDirectory($sourcePublicPath, $targetPath);
        }

        foreach ($this->assetPathsFromManifest($manifest) as $relativeAssetPath) {
            $sourcePath = $sourcePublicPath.DIRECTORY_SEPARATOR.$relativeAssetPath;
            $destinationPath = $targetPath.DIRECTORY_SEPARATOR.$relativeAssetPath;

            $this->copyIfMissingOrChanged($sourcePath, $destinationPath);
        }

        $preview = Arr::get($manifest, 'preview');

        if (is_string($preview) && $preview !== '') {
            $sourcePreviewPath = $rootPath.DIRECTORY_SEPARATOR.trim($preview, '/');
            $destinationPreviewPath = $targetPath.DIRECTORY_SEPARATOR.basename($preview);

            $this->copyIfMissingOrChanged($sourcePreviewPath, $destinationPreviewPath);
        }
    }

    /**
     * @param  array<string, mixed>  $manifest
     * @return list<string>
     */
    private function assetPathsFromManifest(array $manifest): array
    {
        return collect([
            ...Arr::wrap(Arr::get($manifest, 'assets.css', [])),
            ...Arr::wrap(Arr::get($manifest, 'assets.js', [])),
        ])
            ->filter(fn (mixed $path): bool => is_string($path) && trim($path) !== '')
            ->map(fn (string $path): string => trim($path, '/'))
            ->values()
            ->all();
    }

    private function copyIfMissingOrChanged(string $sourcePath, string $destinationPath): void
    {
        if (! File::exists($sourcePath)) {
            return;
        }

        if (
            File::exists($destinationPath)
            && File::lastModified($destinationPath) >= File::lastModified($sourcePath)
        ) {
            return;
        }

        File::ensureDirectoryExists(dirname($destinationPath));
        File::copy($sourcePath, $destinationPath);
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    private function makeRuntimeTheme(string $slug, array $manifest): Theme
    {
        return new Theme([
            'name' => $manifest['name'] ?? Str::headline($slug),
            'slug' => $slug,
            'version' => $manifest['version'] ?? null,
            'author' => $manifest['author'] ?? null,
            'description' => $manifest['description'] ?? null,
            'namespace' => $manifest['namespace'] ?? null,
            'provider' => $manifest['provider'] ?? null,
            'path' => $this->relativeThemePath($slug),
            'screenshot' => $this->screenshotDatabasePath($manifest, $slug),
            'manifest' => $manifest,
            'is_installed' => true,
            'is_active' => false,
        ]);
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    private function upsertThemeRecord(string $slug, array $manifest): Theme
    {
        $themesWereEmpty = Theme::query()->count() === 0;
        $hasActiveTheme = Theme::query()->where('is_active', true)->exists();
        $existingTheme = Theme::query()->where('slug', $slug)->first();

        $theme = Theme::query()->updateOrCreate(
            ['slug' => $slug],
            [
                'name' => $manifest['name'] ?? Str::headline($slug),
                'version' => $manifest['version'] ?? null,
                'author' => $manifest['author'] ?? null,
                'description' => $manifest['description'] ?? null,
                'namespace' => $manifest['namespace'] ?? null,
                'provider' => $manifest['provider'] ?? null,
                'path' => $this->relativeThemePath($slug),
                'screenshot' => $this->screenshotDatabasePath($manifest, $slug),
                'manifest' => $manifest,
                'is_installed' => true,
                'is_active' => $existingTheme?->is_active ?? false,
            ],
        );

        if ($themesWereEmpty && ! $hasActiveTheme) {
            Theme::query()->whereKeyNot($theme->id)->update(['is_active' => false]);
            $theme->forceFill(['is_active' => true])->save();

            Cache::forever((string) config('themes.cache.active_theme_id'), $theme->id);
        }

        return $theme->fresh(['settings']) ?? $theme;
    }

    private function databaseReady(): bool
    {
        try {
            return Schema::hasTable('themes');
        } catch (Throwable) {
            return false;
        }
    }

    private function themePath(string $slug): string
    {
        return rtrim((string) config('themes.paths.themes'), DIRECTORY_SEPARATOR)
            .DIRECTORY_SEPARATOR
            .$slug;
    }

    private function publicPath(string $slug): string
    {
        return rtrim((string) config('themes.paths.public'), DIRECTORY_SEPARATOR)
            .DIRECTORY_SEPARATOR
            .$slug;
    }

    private function relativeThemePath(string $slug): string
    {
        $absolutePath = $this->themePath($slug);
        $basePath = rtrim(base_path(), DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR;

        return Str::after($absolutePath, $basePath);
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    private function screenshotDatabasePath(array $manifest, string $slug): ?string
    {
        $preview = Arr::get($manifest, 'preview');

        if (! is_string($preview) || $preview === '') {
            return null;
        }

        $fileName = basename($preview);
        $targetPath = $this->publicPath($slug).DIRECTORY_SEPARATOR.$fileName;

        if (! File::exists($targetPath)) {
            return null;
        }

        return trim((string) config('themes.public_url_prefix'), '/')."/{$slug}/{$fileName}";
    }
}
