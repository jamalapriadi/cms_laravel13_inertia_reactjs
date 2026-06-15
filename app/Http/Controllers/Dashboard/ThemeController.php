<?php

namespace App\Http\Controllers\Dashboard;

use App\CMS\Themes\ThemeInstaller;
use App\CMS\Themes\ThemeManager;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\Theme\ThemeSettingsUpdateRequest;
use App\Http\Requests\Dashboard\Theme\ThemeUploadRequest;
use App\Models\Theme;
use App\Models\ThemeSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ThemeController extends Controller
{
    public function __construct(
        private readonly ThemeInstaller $themeInstaller,
        private readonly ThemeManager $themeManager,
    ) {}

    public function index(): Response
    {
        $this->themeInstaller->syncInstalledThemes();

        return Inertia::render('Dashboard/Themes/Index', [
            'themes' => Theme::query()
                ->withCount('settings')
                ->orderByDesc('is_active')
                ->orderBy('name')
                ->get()
                ->map(fn (Theme $theme): array => $this->themePayload($theme))
                ->values()
                ->all(),
        ]);
    }

    public function usageGuide(): Response
    {
        return Inertia::render('Dashboard/Themes/UsageGuide', [
            'appUrl' => rtrim((string) config('app.url'), '/'),
        ]);
    }

    public function store(ThemeUploadRequest $request): RedirectResponse
    {
        $this->themeInstaller->installFromZip($request->file('archive'));

        return back()->with('success', 'Theme berhasil di-install.');
    }

    public function activate(Theme $theme): RedirectResponse
    {
        if (! File::isDirectory(base_path($theme->path))) {
            throw ValidationException::withMessages([
                'theme' => 'Folder theme tidak ditemukan. Install ulang theme terlebih dahulu.',
            ]);
        }

        DB::transaction(function () use ($theme): void {
            Theme::query()->update(['is_active' => false]);
            $theme->forceFill(['is_active' => true])->save();
        });

        $this->themeManager->clearCache();
        $this->themeManager->registerActiveThemeViews();

        return back()->with('success', "Theme {$theme->name} sudah aktif.");
    }

    public function customize(Theme $theme): Response
    {
        $this->themeManager->useTheme($theme);

        $settings = collect(Arr::get($theme->manifest, 'settings', []))
            ->map(function (mixed $definition, string $key): array {
                $configuration = is_array($definition) ? $definition : [];

                return [
                    'key' => $key,
                    'type' => $configuration['type'] ?? 'text',
                    'label' => $configuration['label'] ?? Str::headline($key),
                    'default' => $configuration['default'] ?? null,
                    'options' => is_array($configuration['options'] ?? null)
                        ? array_values($configuration['options'])
                        : [],
                    'value' => $this->themeManager->setting($key, $configuration['default'] ?? null),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Dashboard/Themes/Customize', [
            'theme' => $this->themePayload($theme),
            'settings' => $settings,
        ]);
    }

    public function updateSettings(ThemeSettingsUpdateRequest $request, Theme $theme): RedirectResponse
    {
        $definitions = Arr::get($theme->manifest, 'settings', []);
        $settings = $request->validated('settings', []);

        DB::transaction(function () use ($definitions, $settings, $theme): void {
            ThemeSetting::query()
                ->where('theme_id', $theme->id)
                ->whereNotIn('key', array_keys($definitions))
                ->delete();

            foreach ($definitions as $key => $definition) {
                $value = $settings[$key] ?? Arr::get($definition, 'default');

                ThemeSetting::query()->updateOrCreate(
                    [
                        'theme_id' => $theme->id,
                        'key' => $key,
                    ],
                    [
                        'value' => $value,
                    ],
                );
            }
        });

        $this->themeManager->clearCache();

        return redirect()
            ->route('themes.customize', $theme)
            ->with('success', 'Theme settings berhasil disimpan.');
    }

    public function destroy(Theme $theme): RedirectResponse
    {
        if ($theme->is_active) {
            throw ValidationException::withMessages([
                'theme' => 'Theme yang sedang aktif tidak bisa dihapus. Aktifkan theme lain terlebih dahulu.',
            ]);
        }

        $this->themeInstaller->uninstall($theme);

        return back()->with('success', 'Theme berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function themePayload(Theme $theme): array
    {
        return [
            'id' => $theme->id,
            'name' => $theme->name,
            'slug' => $theme->slug,
            'version' => $theme->version,
            'author' => $theme->author,
            'description' => $theme->description,
            'screenshot' => $theme->screenshot ? asset($theme->screenshot) : null,
            'is_installed' => $theme->is_installed,
            'is_active' => $theme->is_active,
            'supports' => Arr::get($theme->manifest, 'supports', []),
            'settings_count' => $theme->settings_count ?? 0,
            'has_settings' => ! empty(Arr::get($theme->manifest, 'settings', [])),
        ];
    }
}
