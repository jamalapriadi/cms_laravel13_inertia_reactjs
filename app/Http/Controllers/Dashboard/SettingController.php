<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Dashboard\Language;
use App\Models\Dashboard\Option;
use App\Models\User;
use App\Services\Api\V1\SiteContentApiService;
use App\Support\ContentEditorMode;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        $websiteMode = Option::getByKey('website_mode', 'commerce');
        $enabledEcommerceMenus = Option::getByKey('enabled_ecommerce_menus', []);

        return Inertia::render('Dashboard/Settings/Index', [
            'websiteMode' => $websiteMode,
            'enabledEcommerceMenus' => is_array($enabledEcommerceMenus) ? $enabledEcommerceMenus : [],
        ]);
    }

    public function general()
    {
        $options = Option::all();

        return Inertia::render('Dashboard/Settings/General', [
            'options' => $options,
        ]);
    }

    public function preferences()
    {
        $options = Option::all();

        return Inertia::render('Dashboard/Settings/Preferences', [
            'options' => $options,
        ]);
    }

    public function management()
    {
        return Inertia::render('Dashboard/Settings/Management', [
            'stats' => [
                'users' => User::count(),
                'roles' => Role::count(),
                'permissions' => Permission::count(),
            ],
        ]);
    }

    public function customer()
    {
        $options = Option::all();

        return Inertia::render('Dashboard/Settings/Customer', [
            'options' => $options,
        ]);
    }

    public function media()
    {
        $options = Option::all();

        return Inertia::render('Dashboard/Settings/Media', [
            'options' => $options,
        ]);
    }

    public function socialite()
    {
        return Inertia::render('Dashboard/Settings/Socialite');
    }

    public function language()
    {
        $languages = Language::all(); // master language table

        $systems = Option::whereIn('key', [
            'languages',
            'default_language',
        ])->get()->keyBy('key');

        return Inertia::render('Dashboard/Settings/Language', [
            'languages' => $languages,
            'availableLanguages' => $systems['languages']->value ?? [],
            'defaultLanguage' => $systems['default_language']->value ?? null,
        ]);
    }

    public function updateLanguage(Request $request)
    {
        foreach ($request->all() as $item) {
            Option::updateOrCreate(
                ['key' => $item['key']],
                ['value' => $item['value']]
            );
        }

        app(SiteContentApiService::class)->flushCache();

        return back()->with('success', 'Language updated successfully');
    }

    public function reading()
    {
        return Inertia::render('Dashboard/Settings/Writing', [
            'defaultContentEditor' => ContentEditorMode::normalize(
                Option::getByKey('default_content_editor', ContentEditorMode::BLOCK)
            ),
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/SystemSettings/Create');
    }
}
