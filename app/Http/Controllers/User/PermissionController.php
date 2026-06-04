<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Permission\StorePermissionRequest;
use App\Http\Requests\Permission\UpdatePermissionRequest;
use App\Services\Dashboard\PermissionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function __construct(
        protected PermissionService $permissionService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only('search');

        $props = list_cache()->rememberRequest('permissions', $request, function () use ($filters) {
            return [
                'permissions' => $this->permissionService->getAll($filters),
                'filters' => $filters,
            ];
        });

        return Inertia::render('Dashboard/Permissions/Index', $props);
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
