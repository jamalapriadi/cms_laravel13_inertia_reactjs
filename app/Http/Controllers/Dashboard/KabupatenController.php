<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Dashboard\Kabupaten;
use App\Models\Dashboard\Province;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KabupatenController extends Controller
{
    public function index(Request $request)
    {
        $props = list_cache()->rememberRequest('wilayah', $request, function () use ($request) {
            $query = Kabupaten::with('province');

            // 🔎 Search
            if ($request->search) {
                $query->where('name', 'like', '%'.$request->search.'%');
            }

            // 🏷 Filter Province
            if ($request->province_id) {
                $query->where('province_id', $request->province_id);
            }

            $kabupatens = $query
                ->orderBy('name')
                ->paginate(10)
                ->withQueryString();

            $provinces = Province::orderBy('name')->get();

            return [
                'kabupatens' => $kabupatens,
                'provinces' => $provinces,
                'filters' => $request->only(['search', 'province_id']),
            ];
        });

        return Inertia::render('Dashboard/Wilayah/Kabupatens/Index', $props);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Wilayah/Kabupatens/Create', [
            'provinces' => Province::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id' => 'required|size:5|unique:kabupatens,id',
            'province_id' => 'required|exists:provinces,id',
            'name' => 'required|string|max:255',
        ]);

        Kabupaten::create($request->all());

        return redirect()->route('kabupatens.index')
            ->with('success', 'Kabupaten berhasil ditambahkan');
    }

    public function edit(Kabupaten $kabupaten)
    {
        return Inertia::render('Dashboard/Wilayah/Kabupatens/Edit', [
            'kabupaten' => $kabupaten,
            'provinces' => Province::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Kabupaten $kabupaten)
    {
        $request->validate([
            'province_id' => 'required|exists:provinces,id',
            'name' => 'required|string|max:255',
        ]);

        $kabupaten->update($request->only('province_id', 'name'));

        return redirect()->route('kabupatens.index')
            ->with('success', 'Kabupaten berhasil diupdate');
    }

    public function destroy(Kabupaten $kabupaten)
    {
        $kabupaten->delete();

        return redirect()->route('kabupatens.index')
            ->with('success', 'Kabupaten berhasil dihapus');
    }
}
