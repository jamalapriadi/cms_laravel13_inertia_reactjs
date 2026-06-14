<?php

use App\Models\Theme;
use App\Models\ThemeSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();

    $basePath = base_path('tests/tmp/theme-manager-'.Str::uuid());

    $this->themeTestBasePath = $basePath;

    config()->set('themes.paths.themes', $basePath.'/themes');
    config()->set('themes.paths.public', $basePath.'/public/vendor/themes');
    config()->set('themes.paths.temp', $basePath.'/temp');
    config()->set('themes.public_url_prefix', 'vendor/themes');

    File::ensureDirectoryExists(config('themes.paths.themes'));
    File::ensureDirectoryExists(config('themes.paths.public'));
    File::ensureDirectoryExists(config('themes.paths.temp'));
});

afterEach(function () {
    File::deleteDirectory($this->themeTestBasePath);
});

function grantThemePermissions(User $user, array $permissions = []): User
{
    $permissions = $permissions !== [] ? $permissions : [
        'themes.view',
        'themes.create',
        'themes.edit',
        'themes.delete',
    ];

    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);

    return $user;
}

function adminWithThemePermissions(): User
{
    return grantThemePermissions(
        User::factory()->create([
            'email_verified_at' => now(),
        ]),
    );
}

function makeThemeUpload(
    string $slug = 'modern-store',
    string $title = 'Modern Store Home',
    array $manifestOverrides = [],
    array $extraFiles = [],
): UploadedFile {
    $rootPath = base_path('tests/tmp/theme-src-'.Str::uuid());
    $themeRoot = $rootPath.'/'.$slug;
    $zipPath = base_path('tests/tmp/theme-archive-'.Str::uuid().'.zip');

    File::ensureDirectoryExists($themeRoot.'/resources/views/layouts');
    File::ensureDirectoryExists($themeRoot.'/resources/views/pages');
    File::ensureDirectoryExists($themeRoot.'/resources/views/products');
    File::ensureDirectoryExists($themeRoot.'/resources/views/categories');
    File::ensureDirectoryExists($themeRoot.'/resources/views/errors');
    File::ensureDirectoryExists($themeRoot.'/public/css');
    File::ensureDirectoryExists($themeRoot.'/public/js');
    File::ensureDirectoryExists(dirname($zipPath));

    $manifest = array_replace_recursive([
        'name' => Str::headline($slug),
        'slug' => $slug,
        'version' => '1.0.0',
        'author' => 'Theme Tester',
        'description' => 'Theme for automated testing.',
        'type' => 'theme',
        'preview' => 'screenshot.svg',
        'templates' => [
            'home' => "{$slug}::home",
            'page' => "{$slug}::pages.show",
            'product_index' => "{$slug}::products.index",
            'product_show' => "{$slug}::products.show",
            'category_show' => "{$slug}::categories.show",
            '404' => "{$slug}::errors.404",
        ],
        'assets' => [
            'css' => ['css/theme.css'],
            'js' => ['js/theme.js'],
        ],
        'settings' => [
            'primary_color' => [
                'type' => 'color',
                'label' => 'Primary Color',
                'default' => '#16a34a',
            ],
            'show_topbar' => [
                'type' => 'boolean',
                'label' => 'Show Topbar',
                'default' => true,
            ],
        ],
    ], $manifestOverrides);

    if (! ($manifestOverrides['__without_manifest'] ?? false)) {
        unset($manifest['__without_manifest']);
        File::put($themeRoot.'/theme.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    File::put($themeRoot.'/screenshot.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#eeeeee"/><text x="20" y="100">'.$slug.'</text></svg>');
    File::put($themeRoot.'/public/css/theme.css', 'body{font-family:serif;}');
    File::put($themeRoot.'/public/js/theme.js', 'window.__theme_test=true;');
    File::put($themeRoot.'/resources/views/layouts/app.blade.php', <<<'BLADE'
<!DOCTYPE html>
<html>
<head>
    <title>{{ $title ?? 'Theme Test' }}</title>
    @foreach(theme_assets('css') as $css)
        <link rel="stylesheet" href="{{ theme_asset($css) }}">
    @endforeach
</head>
<body>
    @yield('content')
    @foreach(theme_assets('js') as $js)
        <script src="{{ theme_asset($js) }}" defer></script>
    @endforeach
</body>
</html>
BLADE);
    File::put($themeRoot.'/resources/views/home.blade.php', <<<BLADE
@extends('{$slug}::layouts.app')

@section('content')
    <h1>{$title}</h1>
@endsection
BLADE);
    File::put($themeRoot.'/resources/views/pages/show.blade.php', <<<BLADE
@extends('{$slug}::layouts.app')

@section('content')
    <h1>{{ \$page['title'] ?? 'Page' }}</h1>
@endsection
BLADE);
    File::put($themeRoot.'/resources/views/products/index.blade.php', <<<BLADE
@extends('{$slug}::layouts.app')

@section('content')
    <h1>Products</h1>
@endsection
BLADE);
    File::put($themeRoot.'/resources/views/products/show.blade.php', <<<BLADE
@extends('{$slug}::layouts.app')

@section('content')
    <h1>{{ \$product['name'] ?? 'Product' }}</h1>
@endsection
BLADE);
    File::put($themeRoot.'/resources/views/categories/show.blade.php', <<<BLADE
@extends('{$slug}::layouts.app')

@section('content')
    <h1>{{ \$category['name'] ?? 'Category' }}</h1>
@endsection
BLADE);
    File::put($themeRoot.'/resources/views/errors/404.blade.php', <<<BLADE
@extends('{$slug}::layouts.app')

@section('content')
    <h1>Missing</h1>
@endsection
BLADE);

    foreach ($extraFiles as $relativePath => $contents) {
        File::ensureDirectoryExists(dirname($themeRoot.'/'.$relativePath));
        File::put($themeRoot.'/'.$relativePath, $contents);
    }

    $zip = new ZipArchive();
    $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($rootPath, FilesystemIterator::SKIP_DOTS)
    );

    foreach ($iterator as $file) {
        if (! $file instanceof SplFileInfo || $file->isDir()) {
            continue;
        }

        $zip->addFile($file->getPathname(), Str::after($file->getPathname(), $rootPath.'/'));
    }

    $zip->close();

    $uploadedFile = UploadedFile::fake()->createWithContent(
        $slug.'.zip',
        (string) file_get_contents($zipPath),
    );

    File::deleteDirectory($rootPath);
    File::delete($zipPath);

    return $uploadedFile;
}

function copyBuiltinTheme(string $slug): void
{
    $sourcePath = base_path('themes/'.$slug);
    $targetPath = config('themes.paths.themes').'/'.$slug;

    File::ensureDirectoryExists(dirname($targetPath));
    File::deleteDirectory($targetPath);
    File::copyDirectory($sourcePath, $targetPath);
}

test('admin can view theme list page', function () {
    $user = adminWithThemePermissions();

    $this->actingAs($user)
        ->get(route('themes.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Themes/Index')
            ->has('themes')
        );
});

test('admin can upload valid theme zip', function () {
    $user = adminWithThemePermissions();

    $this->actingAs($user)
        ->post(route('themes.store'), [
            'archive' => makeThemeUpload(),
        ])
        ->assertRedirect();

    $theme = Theme::query()->where('slug', 'modern-store')->first();

    expect($theme)->not->toBeNull();
    expect(File::isDirectory(config('themes.paths.themes').'/modern-store'))->toBeTrue();
    expect(File::exists(config('themes.paths.public').'/modern-store/css/theme.css'))->toBeTrue();
});

test('upload fails when theme json is missing', function () {
    $user = adminWithThemePermissions();
    $upload = makeThemeUpload('missing-manifest', 'Missing Manifest', [
        '__without_manifest' => true,
    ]);

    $this->actingAs($user)
        ->post(route('themes.store'), ['archive' => $upload])
        ->assertSessionHasErrors('archive');
});

test('upload fails when slug is missing', function () {
    $user = adminWithThemePermissions();
    $upload = makeThemeUpload('missing-slug', 'Missing Slug', [
        'slug' => null,
    ]);

    $this->actingAs($user)
        ->post(route('themes.store'), ['archive' => $upload])
        ->assertSessionHasErrors('archive');
});

test('upload fails when zip contains dangerous file', function () {
    $user = adminWithThemePermissions();
    $upload = makeThemeUpload('danger-theme', 'Danger Theme', extraFiles: [
        'run.sh' => '#!/bin/sh'.PHP_EOL.'echo hacked',
    ]);

    $this->actingAs($user)
        ->post(route('themes.store'), ['archive' => $upload])
        ->assertSessionHasErrors('archive');
});

test('admin can activate theme and only one theme remains active', function () {
    $user = adminWithThemePermissions();

    $this->actingAs($user)->post(route('themes.store'), ['archive' => makeThemeUpload('alpha-theme', 'Alpha Home')]);
    $this->actingAs($user)->post(route('themes.store'), ['archive' => makeThemeUpload('beta-theme', 'Beta Home')]);

    $alpha = Theme::query()->where('slug', 'alpha-theme')->firstOrFail();
    $beta = Theme::query()->where('slug', 'beta-theme')->firstOrFail();

    $this->actingAs($user)->post(route('themes.activate', $alpha))->assertRedirect();
    $this->actingAs($user)->post(route('themes.activate', $beta))->assertRedirect();

    expect(Theme::query()->where('is_active', true)->count())->toBe(1);
    expect($beta->fresh()->is_active)->toBeTrue();
    expect($alpha->fresh()->is_active)->toBeFalse();
});

test('fallback default admin login theme renders when no active theme exists', function () {
    copyBuiltinTheme('default-admin-login');

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertSee('Administrator Login')
        ->assertSee('Sign In to Dashboard');
});

test('fallback admin login form uses existing auth login endpoint and csrf token', function () {
    copyBuiltinTheme('default-admin-login');

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertSee('action="'.route('customer.auth.login.store').'"', false)
        ->assertSee('name="_token"', false)
        ->assertSee('name="email"', false)
        ->assertSee('name="password"', false)
        ->assertSee('name="remember"', false);
});

test('blank 404 theme can be discovered and previewed', function () {
    copyBuiltinTheme('blank-404');

    $user = adminWithThemePermissions();

    $this->actingAs($user)
        ->get(route('themes.index'))
        ->assertSuccessful();

    $theme = Theme::query()->where('slug', 'blank-404')->first();

    expect($theme)->not->toBeNull()
        ->and($theme?->is_installed)->toBeTrue();

    $this->get(route('themes.preview', $theme))
        ->assertSuccessful()
        ->assertSee('Website belum tersedia')
        ->assertSee('Login Administrator');
});

test('blank 404 theme can become the configured fallback theme', function () {
    copyBuiltinTheme('blank-404');
    config()->set('themes.fallback_theme_slug', 'blank-404');
    app(\App\CMS\Themes\ThemeManager::class)->clearCache();

    $theme = app(\App\CMS\Themes\ThemeManager::class)->active();

    expect($theme)->not->toBeNull()
        ->and($theme?->slug)->toBe('blank-404');

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertSee('Website belum tersedia')
        ->assertSee('Login Administrator');
});

test('fallback default admin login theme can be discovered by theme manager', function () {
    copyBuiltinTheme('default-admin-login');

    $theme = app(\App\CMS\Themes\ThemeManager::class)->active();

    expect($theme)->not->toBeNull()
        ->and($theme?->slug)->toBe('default-admin-login');
});

test('active theme can render homepage', function () {
    $user = adminWithThemePermissions();

    $this->actingAs($user)->post(route('themes.store'), ['archive' => makeThemeUpload('render-theme', 'Render Theme Home')]);

    $theme = Theme::query()->where('slug', 'render-theme')->firstOrFail();

    $this->actingAs($user)->post(route('themes.activate', $theme));

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertSee('Render Theme Home');
});

test('blank 404 theme can be activated without affecting dashboard routes', function () {
    copyBuiltinTheme('blank-404');

    $user = adminWithThemePermissions();

    $this->actingAs($user)->get(route('themes.index'))->assertSuccessful();

    $theme = Theme::query()->where('slug', 'blank-404')->firstOrFail();

    $this->actingAs($user)->post(route('themes.activate', $theme))->assertRedirect();

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertSee('Website belum tersedia')
        ->assertSee('Login Administrator');

    $this->actingAs($user)
        ->get(route('themes.index'))
        ->assertSuccessful();
});

test('blank 404 fallback theme is used when active theme template is missing', function () {
    copyBuiltinTheme('blank-404');
    config()->set('themes.fallback_theme_slug', 'blank-404');

    app(\App\CMS\Themes\ThemeInstaller::class)->syncInstalledThemes();

    $user = adminWithThemePermissions();

    $this->actingAs($user)->post(route('themes.store'), ['archive' => makeThemeUpload('broken-render-theme', 'Broken Render Theme')]);

    $theme = Theme::query()->where('slug', 'broken-render-theme')->firstOrFail();

    $this->actingAs($user)->post(route('themes.activate', $theme))->assertRedirect();

    File::delete(config('themes.paths.themes').'/broken-render-theme/resources/views/products/index.blade.php');

    app(\App\CMS\Themes\ThemeManager::class)->clearCache();

    $this->get(route('frontend.products.index'))
        ->assertSuccessful()
        ->assertSee('Template belum tersedia')
        ->assertSee('Login Administrator');
});

test('fallback default admin login theme does not interfere when another theme is active', function () {
    copyBuiltinTheme('default-admin-login');

    $user = adminWithThemePermissions();

    $this->actingAs($user)->post(route('themes.store'), ['archive' => makeThemeUpload('active-store-theme', 'Active Store Theme Home')]);

    $activeTheme = Theme::query()->where('slug', 'active-store-theme')->firstOrFail();

    $this->actingAs($user)->post(route('themes.activate', $activeTheme));

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertSee('Active Store Theme Home')
        ->assertDontSee('Administrator Login');
});

test('preview theme does not change active theme', function () {
    $user = adminWithThemePermissions();

    $this->actingAs($user)->post(route('themes.store'), ['archive' => makeThemeUpload('active-theme', 'Active Theme Home')]);
    $this->actingAs($user)->post(route('themes.store'), ['archive' => makeThemeUpload('preview-theme', 'Preview Theme Home')]);

    $activeTheme = Theme::query()->where('slug', 'active-theme')->firstOrFail();
    $previewTheme = Theme::query()->where('slug', 'preview-theme')->firstOrFail();

    $this->actingAs($user)->post(route('themes.activate', $activeTheme));

    $this->get(route('themes.preview', $previewTheme))
        ->assertSuccessful()
        ->assertSee('Preview Theme Home');

    expect($activeTheme->fresh()->is_active)->toBeTrue();
    expect($previewTheme->fresh()->is_active)->toBeFalse();
});

test('delete theme removes database record and public assets', function () {
    $user = adminWithThemePermissions();

    $this->actingAs($user)->post(route('themes.store'), ['archive' => makeThemeUpload('delete-theme', 'Delete Theme Home')]);

    $theme = Theme::query()->where('slug', 'delete-theme')->firstOrFail();

    $this->actingAs($user)
        ->delete(route('themes.destroy', $theme))
        ->assertRedirect();

    expect(Theme::query()->whereKey($theme->id)->exists())->toBeFalse();
    expect(File::exists(config('themes.paths.public').'/delete-theme'))->toBeFalse();
    expect(File::exists(config('themes.paths.themes').'/delete-theme'))->toBeFalse();
});

test('theme seeder does not override an existing active theme', function () {
    copyBuiltinTheme('default-admin-login');

    $user = adminWithThemePermissions();

    $this->actingAs($user)->post(route('themes.store'), ['archive' => makeThemeUpload('seeded-active-theme', 'Seeded Active Theme Home')]);

    $activeTheme = Theme::query()->where('slug', 'seeded-active-theme')->firstOrFail();

    $this->actingAs($user)->post(route('themes.activate', $activeTheme));

    $this->seed(\Database\Seeders\ThemeSeeder::class);

    expect($activeTheme->fresh()->is_active)->toBeTrue();
    expect(Theme::query()->where('slug', 'default-admin-login')->first()?->is_active)->toBeFalse();
});

test('blank 404 theme seeder does not override an existing active theme', function () {
    copyBuiltinTheme('blank-404');
    config()->set('themes.fallback_theme_slug', 'blank-404');

    $user = adminWithThemePermissions();

    $this->actingAs($user)->post(route('themes.store'), ['archive' => makeThemeUpload('seeded-blank-safe-theme', 'Seeded Blank Safe Theme')]);

    $activeTheme = Theme::query()->where('slug', 'seeded-blank-safe-theme')->firstOrFail();

    $this->actingAs($user)->post(route('themes.activate', $activeTheme));

    $this->seed(\Database\Seeders\ThemeSeeder::class);

    expect($activeTheme->fresh()->is_active)->toBeTrue();
    expect(Theme::query()->where('slug', 'blank-404')->first()?->is_active)->toBeFalse();
});

test('theme seeder marks default admin login as active when themes table is empty', function () {
    copyBuiltinTheme('default-admin-login');

    $this->seed(\Database\Seeders\ThemeSeeder::class);

    $fallbackTheme = Theme::query()->where('slug', 'default-admin-login')->first();

    expect($fallbackTheme)->not->toBeNull()
        ->and($fallbackTheme?->is_active)->toBeTrue()
        ->and($fallbackTheme?->is_installed)->toBeTrue();
});

test('theme seeder can mark blank 404 as active when configured as fallback', function () {
    copyBuiltinTheme('blank-404');
    config()->set('themes.fallback_theme_slug', 'blank-404');

    $this->seed(\Database\Seeders\ThemeSeeder::class);

    $fallbackTheme = Theme::query()->where('slug', 'blank-404')->first();

    expect($fallbackTheme)->not->toBeNull()
        ->and($fallbackTheme?->is_active)->toBeTrue()
        ->and($fallbackTheme?->is_installed)->toBeTrue();
});

test('sync installed themes does not rewrite unchanged public assets', function () {
    copyBuiltinTheme('starter-store');

    $installer = app(\App\CMS\Themes\ThemeInstaller::class);

    $installer->syncInstalledThemes();

    $assetPath = config('themes.paths.public').'/starter-store/css/theme.css';
    $initialModifiedAt = File::lastModified($assetPath);

    sleep(1);

    $installer->syncInstalledThemes();

    expect(File::lastModified($assetPath))->toBe($initialModifiedAt);
});

test('customize theme stores theme settings', function () {
    $user = adminWithThemePermissions();

    $this->actingAs($user)->post(route('themes.store'), ['archive' => makeThemeUpload('custom-theme', 'Custom Theme Home')]);

    $theme = Theme::query()->where('slug', 'custom-theme')->firstOrFail();

    $this->actingAs($user)
        ->put(route('themes.customize.update', $theme), [
            'settings' => [
                'primary_color' => '#111827',
                'show_topbar' => false,
            ],
        ])
        ->assertRedirect(route('themes.customize', $theme));

    expect(ThemeSetting::query()->where('theme_id', $theme->id)->where('key', 'primary_color')->first()?->value)
        ->toBe('#111827');
    expect(ThemeSetting::query()->where('theme_id', $theme->id)->where('key', 'show_topbar')->first()?->value)
        ->toBeFalse();
});
