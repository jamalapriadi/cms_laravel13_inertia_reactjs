<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\Unit\UnitRequest;
use App\Http\Requests\Store\Unit\UnitUpdateRequest;
use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UnitController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');

        $props = list_cache()->rememberRequest('units', $request, function () use ($search) {
            $units = Unit::query()
                ->when($search, function ($query, $search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                })
                ->latest()
                ->paginate(10)
                ->withQueryString();

            return [
                'units' => $units,
                'filters' => ['search' => $search],
            ];
        });

        return Inertia::render('Dashboard/Store/Unit/Index', $props);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Dashboard/Store/Unit/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UnitRequest $request)
    {
        $data = $request->validated();

        if (auth()->check()) {
            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();
        }

        Unit::create($data);

        return redirect()->route('units.index')->with('success', 'Unit created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Unit $unit)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Unit $unit)
    {
        return Inertia::render('Dashboard/Store/Unit/Edit', [
            'unit' => $unit,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UnitUpdateRequest $request, Unit $unit)
    {
        $data = $request->validated();

        if (auth()->check()) {
            $data['updated_by'] = auth()->id();
        }

        $unit->update($data);

        return redirect()->route('units.index')->with('success', 'Unit updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Unit $unit)
    {
        $unit->delete();

        return redirect()->route('units.index')->with('success', 'Unit deleted successfully.');
    }
}
