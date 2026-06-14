<?php

namespace App\CMS\Themes;

use App\Models\Theme;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use ZipArchive;

class ThemeInstaller
{
    public function __construct(
        private readonly ThemeManager $themeManager
    ) {}

    public function installFromZip(UploadedFile $file): Theme
    {
        $temporaryPath = $this->temporaryPath();
        $copiedThemePath = null;
        $copiedPublicPath = null;

        try {
            File::ensureDirectoryExists($temporaryPath);
            $this->extractZipToTemporaryPath($file, $temporaryPath);

            $rootPath = $this->detectRootPath($temporaryPath);
            $manifest = $this->readManifest($rootPath);

            $this->validateManifest($manifest);
            $this->validateFiles($rootPath);

            $slug = $manifest['slug'];
            $copiedThemePath = $this->copyThemeFiles($rootPath, $slug);
            $copiedPublicPath = $this->copyPublicAssets($rootPath, $slug, $manifest);

            $theme = DB::transaction(function () use ($manifest, $slug, $copiedThemePath, $copiedPublicPath): Theme {
                $existingTheme = Theme::query()->where('slug', $slug)->first();
                $isActive = $existingTheme?->is_active ?? false;

                $theme = Theme::query()->updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => $manifest['name'],
                        'version' => $manifest['version'] ?? null,
                        'author' => $manifest['author'] ?? null,
                        'description' => $manifest['description'] ?? null,
                        'namespace' => $manifest['namespace'] ?? null,
                        'provider' => $manifest['provider'] ?? null,
                        'path' => $this->relativeThemePath($slug),
                        'screenshot' => $this->screenshotDatabasePath($manifest, $slug, $copiedPublicPath),
                        'manifest' => $manifest,
                        'is_installed' => true,
                        'is_active' => $isActive,
                    ],
                );

                return $theme->fresh(['settings']) ?? $theme;
            });

            $this->themeManager->clearCache();

            return $theme;
        } catch (\Throwable $exception) {
            if ($copiedThemePath && File::isDirectory($copiedThemePath)) {
                File::deleteDirectory($copiedThemePath);
            }

            if ($copiedPublicPath && File::isDirectory($copiedPublicPath)) {
                File::deleteDirectory($copiedPublicPath);
            }

            throw $exception;
        } finally {
            File::deleteDirectory($temporaryPath);
        }
    }

    public function detectRootPath(string $tempPath): string
    {
        if (File::exists($tempPath.DIRECTORY_SEPARATOR.'theme.json')) {
            return $tempPath;
        }

        $directories = collect(File::directories($tempPath))
            ->filter(fn (string $directory): bool => File::exists($directory.DIRECTORY_SEPARATOR.'theme.json'))
            ->values();

        if ($directories->count() === 1) {
            return $directories->first();
        }

        throw ValidationException::withMessages([
            'archive' => 'ZIP theme harus memiliki file theme.json pada root folder theme.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function readManifest(string $rootPath): array
    {
        $manifestPath = $rootPath.DIRECTORY_SEPARATOR.'theme.json';

        if (! File::exists($manifestPath)) {
            throw ValidationException::withMessages([
                'archive' => 'theme.json tidak ditemukan pada ZIP theme.',
            ]);
        }

        $decoded = json_decode((string) File::get($manifestPath), true);

        if (! is_array($decoded)) {
            throw ValidationException::withMessages([
                'archive' => 'theme.json tidak valid atau tidak bisa dibaca.',
            ]);
        }

        return $decoded;
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    public function validateManifest(array $manifest): void
    {
        $validator = Validator::make($manifest, [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
            'version' => ['required', 'string', 'max:255'],
            'templates' => ['required', 'array', 'min:1'],
            'assets' => ['nullable', 'array'],
            'assets.css' => ['required', 'array'],
            'assets.js' => ['nullable', 'array'],
            'settings' => ['nullable', 'array'],
            'type' => ['nullable', 'in:theme'],
        ]);

        $validator->after(function ($validator) use ($manifest): void {
            $slug = (string) ($manifest['slug'] ?? '');
            $normalizedSlug = Str::slug($slug);

            if ($slug === '' || $normalizedSlug !== $slug) {
                $validator->errors()->add('slug', 'Slug theme harus aman dan mengikuti format slug.');
            }

            foreach (($manifest['templates'] ?? []) as $templateKey => $viewName) {
                if (! is_string($viewName) || ! str_starts_with($viewName, "{$slug}::")) {
                    $validator->errors()->add("templates.{$templateKey}", "Template {$templateKey} harus memakai namespace {$slug}::");
                }
            }
        });

        if ($validator->fails()) {
            throw ValidationException::withMessages([
                'archive' => $validator->errors()->first(),
            ]);
        }
    }

    public function validateFiles(string $rootPath): void
    {
        $manifest = $this->readManifest($rootPath);
        $dangerousExtensions = collect(config('themes.dangerous_extensions', []))
            ->map(fn (mixed $extension): string => strtolower((string) $extension))
            ->filter()
            ->values()
            ->all();

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($rootPath, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if (! $file instanceof \SplFileInfo || $file->isDir()) {
                continue;
            }

            if ($file->isLink()) {
                throw ValidationException::withMessages([
                    'archive' => 'Theme ZIP tidak boleh mengandung symbolic link.',
                ]);
            }

            $relativePath = ltrim(Str::after($file->getPathname(), $rootPath), DIRECTORY_SEPARATOR);
            $segments = array_filter(explode(DIRECTORY_SEPARATOR, $relativePath));
            $baseName = $file->getFilename();
            $extension = strtolower($file->getExtension());

            if ($baseName !== '.DS_Store' && collect($segments)->contains(
                fn (string $segment): bool => str_starts_with($segment, '.')
            )) {
                throw ValidationException::withMessages([
                    'archive' => "File tersembunyi tidak diizinkan di dalam theme: {$relativePath}",
                ]);
            }

            if (in_array($extension, $dangerousExtensions, true)) {
                throw ValidationException::withMessages([
                    'archive' => "File berbahaya terdeteksi pada theme ZIP: {$relativePath}",
                ]);
            }

            if ($extension === 'php' && ! str_ends_with($relativePath, '.blade.php')) {
                throw ValidationException::withMessages([
                    'archive' => "Hanya file Blade (.blade.php) yang diizinkan untuk PHP view: {$relativePath}",
                ]);
            }
        }

        foreach (($manifest['templates'] ?? []) as $viewName) {
            $viewPath = $this->viewPathFromTemplate($rootPath, (string) $viewName, (string) $manifest['slug']);

            if (! File::exists($viewPath)) {
                throw ValidationException::withMessages([
                    'archive' => "Template view tidak ditemukan: {$viewName}",
                ]);
            }
        }
    }

    public function copyThemeFiles(string $rootPath, string $slug): string
    {
        $targetPath = $this->themePath($slug);

        File::ensureDirectoryExists(dirname($targetPath));

        if (File::isDirectory($targetPath)) {
            File::deleteDirectory($targetPath);
        }

        File::copyDirectory($rootPath, $targetPath);

        return $targetPath;
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    public function copyPublicAssets(string $rootPath, string $slug, array $manifest = []): string
    {
        $targetPath = $this->publicPath($slug);
        $publicSourcePath = $rootPath.DIRECTORY_SEPARATOR.'public';

        File::ensureDirectoryExists(dirname($targetPath));

        if (File::isDirectory($targetPath)) {
            File::deleteDirectory($targetPath);
        }

        File::ensureDirectoryExists($targetPath);

        if (File::isDirectory($publicSourcePath)) {
            File::copyDirectory($publicSourcePath, $targetPath);
        }

        $preview = Arr::get($manifest, 'preview');

        if (is_string($preview) && $preview !== '') {
            $sourcePreviewPath = $rootPath.DIRECTORY_SEPARATOR.trim($preview, '/');

            if (File::exists($sourcePreviewPath)) {
                File::copy($sourcePreviewPath, $targetPath.DIRECTORY_SEPARATOR.basename($preview));
            }
        }

        return $targetPath;
    }

    public function uninstall(Theme $theme): void
    {
        DB::transaction(function () use ($theme): void {
            $theme->delete();
        });

        File::deleteDirectory($this->themePath($theme->slug));
        File::deleteDirectory($this->publicPath($theme->slug));

        $this->themeManager->clearCache();
    }

    public function syncInstalledThemes(): void
    {
        $themesRoot = rtrim((string) config('themes.paths.themes'), DIRECTORY_SEPARATOR);

        File::ensureDirectoryExists($themesRoot);

        foreach (File::directories($themesRoot) as $directory) {
            try {
                if (! File::exists($directory.DIRECTORY_SEPARATOR.'theme.json')) {
                    continue;
                }

                $manifest = $this->readManifest($directory);
                $this->validateManifest($manifest);
                $this->validateFiles($directory);
                $this->syncPublicAssets($directory, $manifest['slug'], $manifest);

                Theme::query()->updateOrCreate(
                    ['slug' => $manifest['slug']],
                    [
                        'name' => $manifest['name'],
                        'version' => $manifest['version'] ?? null,
                        'author' => $manifest['author'] ?? null,
                        'description' => $manifest['description'] ?? null,
                        'namespace' => $manifest['namespace'] ?? null,
                        'provider' => $manifest['provider'] ?? null,
                        'path' => $this->relativeThemePath($manifest['slug']),
                        'screenshot' => $this->screenshotDatabasePath($manifest, $manifest['slug'], $this->publicPath($manifest['slug'])),
                        'manifest' => $manifest,
                        'is_installed' => true,
                    ],
                );
            } catch (\Throwable) {
                // Skip invalid local theme directories so the dashboard remains usable.
            }
        }
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    private function syncPublicAssets(string $rootPath, string $slug, array $manifest = []): string
    {
        $targetPath = $this->publicPath($slug);
        $publicSourcePath = $rootPath.DIRECTORY_SEPARATOR.'public';

        File::ensureDirectoryExists($targetPath);

        if (File::isDirectory($publicSourcePath)) {
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($publicSourcePath, \FilesystemIterator::SKIP_DOTS)
            );

            foreach ($iterator as $file) {
                if (! $file instanceof \SplFileInfo || $file->isDir()) {
                    continue;
                }

                $relativePath = ltrim(Str::after($file->getPathname(), $publicSourcePath), DIRECTORY_SEPARATOR);
                $destinationPath = $targetPath.DIRECTORY_SEPARATOR.$relativePath;

                $this->copyFileIfChanged($file->getPathname(), $destinationPath);
            }
        }

        $preview = Arr::get($manifest, 'preview');

        if (is_string($preview) && $preview !== '') {
            $sourcePreviewPath = $rootPath.DIRECTORY_SEPARATOR.trim($preview, '/');

            $this->copyFileIfChanged(
                $sourcePreviewPath,
                $targetPath.DIRECTORY_SEPARATOR.basename($preview),
            );
        }

        return $targetPath;
    }

    private function extractZipToTemporaryPath(UploadedFile $file, string $temporaryPath): void
    {
        $zip = new ZipArchive();
        $opened = $zip->open($file->getRealPath());

        if ($opened !== true) {
            throw ValidationException::withMessages([
                'archive' => 'ZIP theme tidak dapat dibuka.',
            ]);
        }

        for ($index = 0; $index < $zip->numFiles; $index++) {
            $name = $zip->getNameIndex($index);

            if (! is_string($name) || $name === '') {
                continue;
            }

            $normalizedName = str_replace('\\', '/', $name);
            $normalizedName = ltrim($normalizedName, '/');

            if ($normalizedName === '' || str_ends_with($normalizedName, '/')) {
                continue;
            }

            if (str_starts_with($normalizedName, '__MACOSX/') || str_ends_with($normalizedName, '/.DS_Store') || basename($normalizedName) === '.DS_Store') {
                continue;
            }

            if (str_contains($normalizedName, '../') || str_starts_with($normalizedName, '../') || str_contains($normalizedName, '..\\')) {
                throw ValidationException::withMessages([
                    'archive' => 'ZIP theme mengandung path yang tidak aman.',
                ]);
            }

            $attributes = 0;
            $opsys = 0;
            if ($zip->getExternalAttributesIndex($index, $opsys, $attributes)) {
                $mode = ($attributes >> 16) & 0xF000;

                if ($mode === 0xA000) {
                    throw ValidationException::withMessages([
                        'archive' => 'ZIP theme tidak boleh mengandung symbolic link.',
                    ]);
                }
            }

            $targetPath = $temporaryPath.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $normalizedName);

            File::ensureDirectoryExists(dirname($targetPath));

            $stream = $zip->getStream($name);

            if ($stream === false) {
                throw ValidationException::withMessages([
                    'archive' => "Gagal membaca file {$normalizedName} dari ZIP theme.",
                ]);
            }

            $targetHandle = fopen($targetPath, 'wb');

            if ($targetHandle === false) {
                fclose($stream);

                throw ValidationException::withMessages([
                    'archive' => "Gagal menulis file {$normalizedName} ke penyimpanan sementara.",
                ]);
            }

            stream_copy_to_stream($stream, $targetHandle);

            fclose($stream);
            fclose($targetHandle);
        }

        $zip->close();
    }

    private function temporaryPath(): string
    {
        return rtrim((string) config('themes.paths.temp'), DIRECTORY_SEPARATOR)
            .DIRECTORY_SEPARATOR
            .(string) Str::uuid();
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
    private function screenshotDatabasePath(array $manifest, string $slug, string $publicPath): ?string
    {
        $preview = Arr::get($manifest, 'preview');

        if (! is_string($preview) || $preview === '') {
            return null;
        }

        $fileName = basename($preview);

        if (! File::exists($publicPath.DIRECTORY_SEPARATOR.$fileName)) {
            return null;
        }

        return trim(config('themes.public_url_prefix'), '/')."/{$slug}/{$fileName}";
    }

    private function copyFileIfChanged(string $sourcePath, string $destinationPath): void
    {
        if (! File::exists($sourcePath)) {
            return;
        }

        if (
            File::exists($destinationPath)
            && File::size($destinationPath) === File::size($sourcePath)
            && File::hasSameHash($sourcePath, $destinationPath)
        ) {
            return;
        }

        File::ensureDirectoryExists(dirname($destinationPath));
        File::copy($sourcePath, $destinationPath);
    }

    private function viewPathFromTemplate(string $rootPath, string $viewName, string $slug): string
    {
        $viewWithoutNamespace = Str::after($viewName, "{$slug}::");
        $relativeViewPath = str_replace('.', DIRECTORY_SEPARATOR, $viewWithoutNamespace).'.blade.php';

        return $rootPath.DIRECTORY_SEPARATOR.'resources'.DIRECTORY_SEPARATOR.'views'.DIRECTORY_SEPARATOR.$relativeViewPath;
    }
}
