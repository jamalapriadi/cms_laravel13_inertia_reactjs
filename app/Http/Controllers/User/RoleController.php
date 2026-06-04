<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Services\Dashboard\RoleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function __construct(
        protected RoleService $roleService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only('search');

        $props = list_cache()->rememberRequest('roles', $request, function () use ($filters) {
            return [
                'roles' => $this->roleService->getAll($filters),
                'filters' => $filters,
            ];
        });

        return Inertia::render('Dashboard/Roles/Index', $props);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Roles/Create');
    }

    public function store(StoreRoleRequest $request)
    {
        $this->roleService->store($request->validated());

        return redirect()
            ->route('roles.index')
            ->with('success', 'Role created successfully');
    }

    public function edit(Role $role)
    {
        return Inertia::render('Dashboard/Roles/Edit', [
            'role' => $role->load('permissions'),
            'permissions' => $this->roleService->getAllPermissions(),
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        $this->roleService->update($role, $request->validated());

        $this->roleService->syncPermissions(
            $role,
            $request->input('permissions', [])
        );

        return redirect()
            ->route('roles.index')
            ->with('success', 'Role updated successfully');
    }

    public function destroy(Role $role)
    {
        $this->roleService->delete($role);

        return back()->with('success', 'Role deleted successfully');
    }
}
