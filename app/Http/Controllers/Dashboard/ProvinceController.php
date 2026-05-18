<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Dashboard\Province;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProvinceController extends Controller
{
    public function index(Request $request)
    {
        $query = Province::query();

        // 🔎 Search
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $provinces = $query
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Dashboard/Wilayah/Provinces/Index', [
            'provinces' => $provinces,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Wilayah/Provinces/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'id' => 'required|size:2|unique:provinces,id',
            'name' => 'required|string|max:255',
        ]);

        Province::create($request->only('id', 'name'));

        return redirect()->route('provinces.index')
            ->with('success', 'Province berhasil ditambahkan');
    }

    public function edit(Province $province)
    {
        return Inertia::render('Dashboard/Wilayah/Provinces/Edit', [
            'province' => $province,
        ]);
    }

    public function update(Request $request, Province $province)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $province->update($request->only('name'));

        return redirect()->route('provinces.index')
            ->with('success', 'Province berhasil diupdate');
    }

    public function destroy(Province $province)
    {
        $province->delete();

        return redirect()->route('provinces.index')
            ->with('success', 'Province berhasil dihapus');
    }
}