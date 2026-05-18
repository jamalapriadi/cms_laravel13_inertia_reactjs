<?php

namespace App\Http\Controllers\User;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Services\Dashboard\PermissionService;
use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Permission;
use App\Http\Requests\Permission\StorePermissionRequest;
use App\Http\Requests\Permission\UpdatePermissionRequest;

class PermissionController extends Controller
{
    public function __construct(
        protected PermissionService $permissionService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only('search');

        return Inertia::render('Dashboard/Permissions/Index', [
            'permissions' => $this->permissionService->getAll($filters),
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Permissions/Create');
    }

    public function store(StorePermissionRequest $request)
    {
        $this->permissionService->store($request->validated());

        return redirect()
            ->route('permissions.index')
            ->with('success', 'Permission created');
    }

    public function edit(Permission $permission)
    {
        return Inertia::render('Dashboard/Permissions/Edit', [
            'permission' => $permission,
        ]);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission)
    {
        $this->permissionService->update($permission, $request->validated());

        return redirect()
            ->route('permissions.index')
            ->with('success', 'Permission updated');
    }

    public function destroy(Permission $permission)
    {
        $this->permissionService->delete($permission);

        return back()->with('success', 'Permission deleted');
    }
}