<?php

namespace App\Services\Dashboard;

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

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
        $role->update([
            'name' => $data['name'],
        ]);

        return $role;
    }

    public function delete(Role $role)
    {
        return $role->delete();
    }

    public function getAllPermissions()
    {
        return Permission::query()
            ->orderBy('name')
            ->get();
    }

    public function syncPermissions(Role $role, array $permissions = [])
    {
        $role->syncPermissions($permissions);

        return $role->load('permissions');
    }
}