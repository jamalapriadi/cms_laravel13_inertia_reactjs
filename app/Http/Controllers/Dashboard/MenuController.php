<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Dashboard\Menu;
use App\Models\Dashboard\Option;
use App\Services\Dashboard\MenuService;
use Inertia\Inertia;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        $menus = Menu::query()
            ->when($request->search, fn ($q) =>
                $q->where('name', 'like', '%' . $request->search . '%')
            )
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Dashboard/Menus/Index', [
            'menus' => $menus,
            'filters' => $request->only('search'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Menus/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:menus,slug',
        ]);

        Menu::create($validated);

        return redirect()
            ->route('menus.index')
            ->with('success', 'Menu berhasil dibuat');
    }

    public function show($slug, Request $request, MenuService $service)
    {
        $locale = $request->get('locale', app()->getLocale());

        $menu = $service->getMenuByLocale($slug, $locale);

        return response()->json($menu);
    }

    public function edit(Menu $menu, MenuService $service)
    {
        $default_language = Option::where('key','default_language')->first()->value ?? 'ID';
        $menuData = $service->getMenuTree($menu->slug);
        
        $languages = Option::where('key','languages')->first()->value ?? [];


        return Inertia::render('Dashboard/Menus/Edit', [
            'menu' => $menu,
            'languages' => json_decode($languages, true) ?? [],
            'items' => $menuData
                ? $service->buildTree($menuData->items)
                : [],
            'default_language' => $default_language,
        ]);
    }

    public function update(Request $request, Menu $menu, MenuService $service)
    {
        // 🔥 VALIDASI BASIC
        $data = $request->validate([
            'items' => 'nullable|array',
        ]);

        $items = $data['items'] ?? [];

        try {
            // 🔥 VALIDASI TREE
            $service->validateTree($items);

            // 🔥 SAVE TREE
            $service->saveTree($menu->id, $items);

            return redirect()
                ->back()
                ->with('success', 'Menu updated');

        } catch (\Throwable $e) {
            return redirect()
                ->back()
                ->withErrors([
                    'menu' => $e->getMessage(),
                ]);
        }
    }
}