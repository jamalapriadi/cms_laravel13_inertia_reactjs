<?php

namespace App\Services\Dashboard;

use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionService
{
    public function getAll(array $filters = [])
    {
        return Permission::query()
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    public function store(array $data)
    {
        $permission = Permission::create([
            'name' => $data['name'],
            'guard_name' => 'web',
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $permission;
    }

    public function update(Permission $permission, array $data)
    {
        $permission->update([
            'name' => $data['name'],
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $permission;
    }

    public function delete(Permission $permission)
    {
        $deleted = $permission->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $deleted;
    }
}
