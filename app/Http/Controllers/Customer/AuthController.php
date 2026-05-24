<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerAuth\CustomerForgotPasswordRequest;
use App\Http\Requests\CustomerAuth\CustomerLoginRequest;
use App\Http\Requests\CustomerAuth\CustomerRegisterRequest;
use App\Http\Requests\CustomerAuth\CustomerResetPasswordRequest;
use App\Models\Shop\Customer;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function login(): Response
    {
        return Inertia::render('Onboard/Auth/Login', [
            'status' => session('status'),
        ]);
    }

    public function authenticate(CustomerLoginRequest $request): RedirectResponse
    {
        $credentials = $request->validated();
        $remember = (bool) ($credentials['remember'] ?? false);

        unset($credentials['remember']);

        if (! Auth::guard('customer')->attempt($credentials, $remember)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

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

    public function register(): Response
    {
        return Inertia::render('Onboard/Auth/Register');
    }

    public function store(CustomerRegisterRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());

        Auth::guard('customer')->login($customer);

        $request->session()->regenerate();

        return redirect()->route('customer.dashboard');
    }

    public function forgotPassword(): Response
    {
        return Inertia::render('Onboard/Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    public function sendResetLink(CustomerForgotPasswordRequest $request): RedirectResponse
    {
        $status = Password::broker('customers')->sendResetLink($request->validated());

        return $status === Password::RESET_LINK_SENT
            ? back()->with('status', __($status))
            : back()->withErrors(['email' => __($status)]);
    }

    public function resetPassword(Request $request): Response
    {
        return Inertia::render('Onboard/Auth/RecoveryPassword', [
            'email' => $request->query('email', ''),
            'token' => $request->query('token', ''),
        ]);
    }

    public function updatePassword(CustomerResetPasswordRequest $request): RedirectResponse
    {
        $status = Password::broker('customers')->reset(
            $request->validated(),
            function (Customer $customer, string $password) {
                $customer->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => null,
                ])->save();

                event(new PasswordReset($customer));
            },
        );

        return $status === Password::PASSWORD_RESET
            ? redirect()->route('customer.login')->with('status', __($status))
            : back()->withErrors(['email' => __($status)]);
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('customer')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('customer.login');
    }
}
