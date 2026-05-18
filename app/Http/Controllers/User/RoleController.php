<?php

namespace App\Http\Controllers\User;

use Inertia\Inertia;
use App\Services\Dashboard\RoleService;
use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Role;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function __construct(
        protected RoleService $roleService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only('search');

        return Inertia::render('Dashboard/Roles/Index', [
            'roles' => $this->roleService->getAll($filters),
            'filters' => $filters,
        ]);
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