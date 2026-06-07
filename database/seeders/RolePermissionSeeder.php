<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\DashboardPermissions;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (DashboardPermissions::all() as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        foreach (DashboardPermissions::roles() as $roleName => $permissions) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);

            $role->syncPermissions($permissions);
        }

        $this->assignInitialSuperAdmin();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function assignInitialSuperAdmin(): void
    {
        if (User::role('super-admin')->exists()) {
            return;
        }

        $user = User::query()
            ->where('email', 'jamal.apriadi@gmail.com')
            ->orWhere('email', config('app.admin_email'))
            ->orWhereNotNull('email_verified_at')
            ->oldest('id')
            ->first();

        $user ??= User::query()->oldest('id')->first();

        $user?->assignRole('super-admin');
    }
}
