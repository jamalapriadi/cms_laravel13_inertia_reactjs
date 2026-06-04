<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Dashboard\Kabupaten;
use App\Models\Dashboard\Kecamatan;
use App\Models\Dashboard\Province;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KecamatanController extends Controller
{
    public function index(Request $request)
    {
        $props = list_cache()->rememberRequest('wilayah', $request, function () use ($request) {
            $kecamatans = Kecamatan::with('kabupaten.province')
                ->when($request->province_id, function ($query) use ($request) {
                    $query->whereHas('kabupaten', function ($q) use ($request) {
                        $q->where('province_id', $request->province_id);
                    });
                })
                ->when($request->kabupaten_id, function ($query) use ($request) {
                    $query->where('kabupaten_id', $request->kabupaten_id);
                })
                ->when($request->search, function ($query) use ($request) {
                    $query->where('name', 'like', '%'.$request->search.'%');
                })
                ->orderBy('id')
                ->paginate(10)
                ->withQueryString();

            return [
                'kecamatans' => $kecamatans,
                'filters' => $request->only('search', 'province_id', 'kabupaten_id'),
                'provinces' => Province::orderBy('name')->get(),
                'kabupatens' => $request->province_id
                    ? Kabupaten::where('province_id', $request->province_id)->orderBy('name')->get()
                    : [],
            ];
        });

        return Inertia::render('Dashboard/Wilayah/Kecamatans/Index', $props);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Wilayah/Kecamatans/Create', [
            'provinces' => Province::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|size:8|unique:kecamatans,id',
            'kabupaten_id' => 'required|exists:kabupatens,id',
            'name' => 'required|string|max:255',
        ]);

        Kecamatan::create($validated);

        return redirect()->route('kecamatans.index')
            ->with('success', 'Kecamatan berhasil ditambahkan');
    }

    public function edit(Kecamatan $kecamatan)
    {
        $kecamatan->load('kabupaten.province');

        return Inertia::render('Dashboard/Wilayah/Kecamatans/Edit', [
            'kecamatan' => $kecamatan,
            'provinces' => Province::orderBy('name')->get(),
            'kabupatens' => Kabupaten::where('province_id', $kecamatan->kabupaten->province_id)
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function update(Request $request, Kecamatan $kecamatan)
    {
        $validated = $request->validate([
            'kabupaten_id' => 'required|exists:kabupatens,id',
            'name' => 'required|string|max:255',
        ]);

        $kecamatan->update($validated);

        return redirect()->route('kecamatans.index')
            ->with('success', 'Kecamatan berhasil diupdate');
    }

    public function destroy(Kecamatan $kecamatan)
    {
        $kecamatan->delete();

        return redirect()->route('kecamatans.index')
            ->with('success', 'Kecamatan berhasil dihapus');
    }
}
