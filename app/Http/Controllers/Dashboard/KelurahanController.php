<?php

namespace App\Http\Controllers\Dashboard;
use App\Http\Controllers\Controller;

use App\Models\Dashboard\Kelurahan;
use App\Models\Dashboard\Kecamatan;
use App\Models\Dashboard\Kabupaten;
use App\Models\Dashboard\Province;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KelurahanController extends Controller
{
    public function index(Request $request)
    {
        $kelurahans = Kelurahan::with('kecamatan.kabupaten.province')
            ->when($request->provinsi_id, function ($query) use ($request) {
                $query->whereHas('kecamatan.kabupaten', function ($q) use ($request) {
                    $q->where('province_id', $request->provinsi_id);
                });
            })
            ->when($request->kabupaten_id, function ($query) use ($request) {
                $query->whereHas('kecamatan', function ($q) use ($request) {
                    $q->where('kabupaten_id', $request->kabupaten_id);
                });
            })
            ->when($request->kecamatan_id, function ($query) use ($request) {
                $query->where('kecamatan_id', $request->kecamatan_id);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Dashboard/Wilayah/Kelurahans/Index', [
            'kelurahans' => $kelurahans,
            'provinsis' => Province::orderBy('name')->get(),
            'filters' => $request->only(['province_id', 'kabupaten_id', 'kecamatan_id'])
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Wilayah/Kelurahans/Create', [
            'provinces' => Province::orderBy('name')
                ->select('id', 'name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id' => 'required|unique:kelurahans,id',
            'kecamatan_id' => 'required|exists:kecamatans,id',
            'name' => 'required|string|max:255'
        ]);

        Kelurahan::create($request->all());

        return redirect()->route('kelurahans.index');
    }

    public function edit(Kelurahan $kelurahan)
    {
        return Inertia::render('Dashboard/Wilayah/Kelurahans/Edit', [
            'kelurahan' => [
                'id' => $kelurahan->id,
                'province_id' => $kelurahan->province_id,
                'kabupaten_id' => $kelurahan->kabupaten_id,
                'kecamatan_id' => $kelurahan->kecamatan_id,
                'name' => $kelurahan->name,
            ],

            'provinces' => Province::orderBy('name')
                ->select('id', 'name')
                ->get(),
        ]);
    }


    public function update(Request $request, Kelurahan $kelurahan)
    {
        $request->validate([
            'kecamatan_id' => 'required|exists:kecamatans,id',
            'name' => 'required|string|max:255'
        ]);

        $kelurahan->update($request->only('kecamatan_id', 'name'));

        return redirect()->route('kelurahans.index');
    }

    public function destroy(Kelurahan $kelurahan)
    {
        $kelurahan->delete();
        return back();
    }

    // AJAX Cascading
    public function getKabupaten($provinsiId)
    {
        return Kabupaten::where('province_id', $provinsiId)->get();
    }

    public function getKecamatan($kabupatenId)
    {
        return Kecamatan::where('kabupaten_id', $kabupatenId)->get();
    }
}
