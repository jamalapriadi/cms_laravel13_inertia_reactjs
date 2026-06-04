<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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
            $user->syncRoles($data['roles']);
            list_cache()->clearMany(['users', 'roles']);
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

        $user->syncRoles($data['roles'] ?? []);
        list_cache()->clearMany(['users', 'roles']);

        return $user;
    }

    public function delete(User $user)
    {
        $user->delete();
    }

    public function toggleStatus(int $id): void
    {
        $user = User::findOrFail($id);

        if (auth()->id() === $user->id) {
            throw ValidationException::withMessages([
                'status' => 'You cannot deactivate your own account.',
            ]);
        }

        $user->update([
            'is_active' => ! $user->is_active,
        ]);
    }
}
