<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\Supplier\SupplierRequest;
use App\Models\Shop\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    /**
     * Display a listing of suppliers.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');

        $props = list_cache()->rememberRequest('suppliers', $request, function () use ($search) {
            $suppliers = Supplier::query()
                ->when($search, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
                })
                ->latest()
                ->paginate(10)
                ->withQueryString();

            return [
                'suppliers' => $suppliers,
                'filters' => [
                    'search' => $search,
                ],
            ];
        });

        return Inertia::render('Dashboard/Store/Supplier/Index', $props);
    }

    /**
     * Show the form for creating a new supplier.
     */
    public function create(): Response
    {
        return Inertia::render('Dashboard/Store/Supplier/Create');
    }

    /**
     * Store a newly created supplier.
     */
    public function store(SupplierRequest $request)
    {
        $data = $request->validated();

        if (auth()->check()) {
            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();
        }

        Supplier::create($data);

        return redirect()->route('suppliers.index')->with('success', 'Supplier created successfully.');
    }

    /**
     * Display the specified supplier.
     */
    public function show(Supplier $supplier): Response
    {
        $supplier->loadCount(['incomingGoods', 'returns']);

        return Inertia::render('Dashboard/Store/Supplier/Show', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Show the form for editing the specified supplier.
     */
    public function edit(Supplier $supplier): Response
    {
        return Inertia::render('Dashboard/Store/Supplier/Edit', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Update the specified supplier.
     */
    public function update(SupplierRequest $request, Supplier $supplier)
    {
        $data = $request->validated();

        if (auth()->check()) {
            $data['updated_by'] = auth()->id();
        }

        $supplier->update($data);

        return redirect()->route('suppliers.index')->with('success', 'Supplier updated successfully.');
    }

    /**
     * Remove the specified supplier.
     */
    public function destroy(Supplier $supplier)
    {
        // Prevent deleting supplier if they have associated incoming goods
        if ($supplier->incomingGoods()->exists() || $supplier->returns()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete supplier because they have associated transactions.');
        }

        $supplier->delete();

        return redirect()->route('suppliers.index')->with('success', 'Supplier deleted successfully.');
    }
}
