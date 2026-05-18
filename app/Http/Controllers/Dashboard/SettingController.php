<?php

namespace App\Http\Controllers\Dashboard;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;


use App\Models\Dashboard\Option;
use App\Models\Dashboard\Language;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class SettingController extends Controller
{
    public function index(Request $request){
        return Inertia::render('Dashboard/Settings/Index');
    }

    public function general()
    {
        $options = Option::all();
        return Inertia::render('Dashboard/Settings/General',[
            'options'=>$options
        ]);
    }

    public function preferences()
    {
        $options = Option::all();
        return Inertia::render('Dashboard/Settings/Preferences',[
            'options'=>$options
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
        return Inertia::render('Dashboard/Settings/Customer',[
            'options'=>$options
        ]);
    }

    public function media()
    {
        $options = Option::all();
        return Inertia::render('Dashboard/Settings/Media',[
            'options'=>$options
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
            'default_language'
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

        return back()->with('success', 'Language updated successfully');
    }

    public function reading()
    {
        return Inertia::render('Dashboard/Settings/Reading');
    }

    public function create()
    {
        return Inertia::render('Dashboard/SystemSettings/Create');
    }
}
