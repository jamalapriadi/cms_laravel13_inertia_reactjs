<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Dashboard\Menu;
use App\Models\Dashboard\Option;
use App\Services\Dashboard\MenuService;
use Illuminate\Validation\Rule;
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

    public function edit(Menu $menu)
    {
        return Inertia::render('Dashboard/Menus/Edit', [
            'menu' => $menu,
        ]);
    }

    public function update(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('menus', 'slug')->ignore($menu->id),
            ],
        ]);

        $menu->update($validated);

        return redirect()
            ->route('menus.index')
            ->with('success', 'Menu berhasil diperbarui');
    }

    public function destroy(Menu $menu)
    {
        $menu->delete();

        return redirect()
            ->route('menus.index')
            ->with('success', 'Menu berhasil dihapus');
    }

    public function builder(Menu $menu, MenuService $service)
    {
        $default_language = strtolower(Option::where('key', 'default_language')->first()?->value ?? 'id');
        $menuData = $service->getMenuTree($menu->slug);
        $languages = Option::where('key', 'languages')->first()?->value ?? [];

        if (is_string($languages)) {
            $languages = json_decode($languages, true) ?: [];
        }

        return Inertia::render('Dashboard/Menus/Builder', [
            'menu' => $menu,
            'languages' => $languages,
            'items' => $menuData
                ? $service->buildTree($menuData->items)
                : [],
            'default_language' => $default_language,
        ]);
    }

    public function updateBuilder(Request $request, Menu $menu, MenuService $service)
    {
        $data = $request->validate([
            'items' => 'nullable|array',
        ]);

        $items = $data['items'] ?? [];

        try {
            $service->validateTree($items);

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
