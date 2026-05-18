<?php

namespace App\Services\Dashboard;

use Spatie\Permission\Models\Permission;

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
        return Permission::create([
            'name' => $data['name'],
            'guard_name' => 'web',
        ]);
    }

    public function update(Permission $permission, array $data)
    {
        $permission->update([
            'name' => $data['name'],
        ]);

        return $permission;
    }

    public function delete(Permission $permission)
    {
        return $permission->delete();
    }
}