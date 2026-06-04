<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PackageController extends Controller
{
    public function index(Request $request)
    {
        $props = list_cache()->rememberRequest('packages', $request, function () use ($request) {
            $query = Package::query();

            if ($request->has('search')) {
                $search = $request->search;
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            }

            $packages = $query->latest()->paginate(10)->withQueryString();

            return [
                'packages' => $packages,
                'filters' => $request->only(['search']),
            ];
        });

        return Inertia::render('Dashboard/Packages/Index', $props);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Packages/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3',
            'location' => 'required|string',
            'speed' => 'required|string',
            'price' => 'required|numeric|min:1000',
        ]);

        Package::create($validated);

        return redirect()->route('packages.index')->with('success', 'Paket berhasil ditambahkan!');
    }

    public function edit(Package $package)
    {
        return Inertia::render('Dashboard/Packages/Edit', [
            'package' => $package,
        ]);
    }

    public function update(Request $request, Package $package)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3',
            'location' => 'required|string',
            'speed' => 'required|string',
            'price' => 'required|numeric|min:1000',
        ]);

        $package->update($validated);

        return redirect()->route('packages.index')->with('success', 'Paket berhasil diperbarui!');
    }

    public function destroy(Package $package)
    {
        $package->delete();

        return back()->with('success', 'Paket berhasil dihapus!');
    }
}
