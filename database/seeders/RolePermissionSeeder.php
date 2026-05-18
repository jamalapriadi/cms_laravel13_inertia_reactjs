<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // reset cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        /**
         * ✅ PERMISSIONS
         */
        $permissions = [
            // Post
            'post.view',
            'post.create',
            'post.update',
            'post.delete',

            // Category
            'category.view',
            'category.manage',

            // Taxonomy
            'taxonomy.view',
            'taxonomy.manage',

            // System
            'menu.manage',
            'media.manage',
            'settings.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        /**
         * ✅ ROLES
         */
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $editor = Role::firstOrCreate(['name' => 'editor']);

        /**
         * ✅ ASSIGN PERMISSION
         */
        $admin->syncPermissions(Permission::all());

        $editor->syncPermissions([
            'post.view',
            'post.create',
            'post.update',
        ]);

        $allUser= \App\Models\User::all();
        foreach($allUser as $key=>$user){
            $user->assignRole('admin');
        }
    }
}
