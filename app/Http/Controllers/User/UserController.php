<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function index(Request $request)
    {
        $props = list_cache()->rememberRequest('users', $request, function () use ($request) {
            return [
                'users' => $this->userService->paginate(
                    $request->search,
                    $request->role,
                    $request->status
                ),
                'roles' => Role::orderBy('name')->get(),
                'filters' => $request->only('search', 'role', 'status'),
            ];
        });

        return Inertia::render('Dashboard/Users/Index', $props);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Users/Create', [
            'roles' => Role::orderBy('name')->get(),
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $this->userService->store($request->validated());

        return redirect()->route('users.index')
            ->with('success', 'User created');
    }

    public function edit(User $user)
    {
        return Inertia::render('Dashboard/Users/Edit', [
            'user' => $user->load('roles'),
            'roles' => Role::orderBy('name')->get(),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $this->userService->update($user, $request->validated());

        return redirect()->route('users.index')
            ->with('success', 'User updated');
    }

    public function destroy(User $user)
    {
        $this->userService->delete($user);

        return back()->with('success', 'User deleted');
    }

    public function toggleStatus($id)
    {
        $this->userService->toggleStatus($id);

        return back()->with('success', 'User status updated successfully.');
    }
}
