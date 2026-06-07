<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\PermissionRegistrar;

class UserService
{
    public function paginate(?string $search = null, ?string $role = null, ?string $status = null)
    {
        return User::query()
            ->with('roles')
            ->withCount('roles')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($role, function ($query) use ($role) {
                $query->whereHas('roles', function ($q) use ($role) {
                    $q->where('name', $role);
                });
            })
            ->when($status, function ($query) use ($status) {
                if ($status === 'active') {
                    $query->where('is_active', true);
                }

                if ($status === 'inactive') {
                    $query->where('is_active', false);
                }
            })
            ->paginate(10)
            ->withQueryString();
    }

    public function store(array $data)
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        if (! empty($data['roles'])) {
            $this->ensureRolesCanBeSynced($user, $data['roles']);
            $user->syncRoles($data['roles']);
            list_cache()->clearMany(['users', 'roles']);
            app(PermissionRegistrar::class)->forgetCachedPermissions();
        }

        return $user;
    }

    public function update(User $user, array $data)
    {
        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        if (! empty($data['password'])) {
            $user->update([
                'password' => Hash::make($data['password']),
            ]);
        }

        $roles = $data['roles'] ?? [];

        $this->ensureRolesCanBeSynced($user, $roles);
        $user->syncRoles($roles);
        list_cache()->clearMany(['users', 'roles']);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    public function delete(User $user)
    {
        $this->ensureUserCanLoseSuperAdmin($user);

        $user->delete();
        list_cache()->clearMany(['users', 'roles']);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function toggleStatus(int $id): void
    {
        $user = User::findOrFail($id);

        if (auth()->id() === $user->id) {
            throw ValidationException::withMessages([
                'status' => 'You cannot deactivate your own account.',
            ]);
        }

        if ($user->hasRole('super-admin') && $user->is_active) {
            $this->ensureAnotherActiveSuperAdminExists($user);
        }

        $user->update([
            'is_active' => ! $user->is_active,
        ]);
    }

    /**
     * @param  string[]  $roles
     */
    private function ensureRolesCanBeSynced(User $user, array $roles): void
    {
        $containsSuperAdmin = in_array('super-admin', $roles, true);

        if ($containsSuperAdmin && ! auth()->user()?->hasRole('super-admin')) {
            throw ValidationException::withMessages([
                'roles' => 'Only a super-admin can assign the super-admin role.',
            ]);
        }

        if ($user->hasRole('super-admin') && ! $containsSuperAdmin) {
            $this->ensureUserCanLoseSuperAdmin($user);
        }
    }

    private function ensureUserCanLoseSuperAdmin(User $user): void
    {
        if (! $user->hasRole('super-admin')) {
            return;
        }

        if (auth()->id() === $user->id) {
            throw ValidationException::withMessages([
                'roles' => 'You cannot remove your own super-admin access.',
            ]);
        }

        $this->ensureAnotherActiveSuperAdminExists($user);
    }

    private function ensureAnotherActiveSuperAdminExists(User $user): void
    {
        $hasAnotherSuperAdmin = User::role('super-admin')
            ->whereKeyNot($user->getKey())
            ->where('is_active', true)
            ->exists();

        if (! $hasAnotherSuperAdmin) {
            throw ValidationException::withMessages([
                'roles' => 'At least one active super-admin must remain.',
            ]);
        }
    }
}
