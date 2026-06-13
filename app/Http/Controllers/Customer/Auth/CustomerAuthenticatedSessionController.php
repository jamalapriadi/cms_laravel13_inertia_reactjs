<?php

namespace App\Http\Controllers\Customer\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerAuth\CustomerLoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Customer/Auth/Login', [
            'status' => session('status'),
        ]);
    }

    public function store(CustomerLoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $customer = Auth::guard('customer')->user();

        if (! $customer->is_active) {
            Auth::guard('customer')->logout();

            throw ValidationException::withMessages([
                'email' => 'Akun customer Anda belum aktif.',
            ]);
        }

        $request->session()->regenerate();

        $customer->forceFill([
            'last_login_at' => now(),
        ])->save();

        return redirect()->intended(route('customer.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('customer')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('customer.auth.login');
    }
}
