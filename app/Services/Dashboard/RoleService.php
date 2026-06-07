<?php

namespace App\Services\Dashboard;

use App\Support\DashboardPermissions;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleService
{
    public function getAll(array $filters = [])
    {
        return Role::query()
            ->withCount('permissions')
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    public function store(array $data)
    {
        return Role::create([
            'name' => $data['name'],
            'guard_name' => 'web',
        ]);
    }

    public function update(Role $role, array $data)
    {
        if ($role->name === 'super-admin' && ($data['name'] ?? $role->name) !== 'super-admin') {
            throw ValidationException::withMessages([
                'name' => 'The super-admin role cannot be renamed.',
            ]);
        }

        $role->update([
            'name' => $data['name'],
        ]);

        return $role;
    }

    public function delete(Role $role)
    {
        if ($role->name === 'super-admin') {
            throw ValidationException::withMessages([
                'role' => 'The super-admin role cannot be deleted.',
            ]);
        }

        $deleted = $role->delete();
        list_cache()->clearMany(['roles', 'permissions', 'users']);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $deleted;
    }

    public function getAllPermissions()
    {
        return Permission::query()
            ->orderBy('name')
            ->get();
    }

    public function syncPermissions(Role $role, array $permissions = [])
    {
        if ($role->name === 'super-admin') {
            $permissions = DashboardPermissions::all();
        }

        $role->syncPermissions($permissions);
        list_cache()->clearMany(['roles', 'permissions', 'users']);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $role->load('permissions');
    }
}
