<?php

namespace App\Http\Controllers\Customer\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerAuth\CustomerResetPasswordRequest;
use App\Models\Shop\Customer;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class CustomerNewPasswordController extends Controller
{
    public function create(Request $request, string $token): Response
    {
        return Inertia::render('Customer/Auth/RecoveryPassword', [
            'email' => (string) $request->query('email', ''),
            'token' => $token,
        ]);
    }

    public function store(CustomerResetPasswordRequest $request): RedirectResponse
    {
        $status = Password::broker('customers')->reset(
            $request->validated(),
            function (Customer $customer, string $password): void {
                $customer->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => null,
                ])->save();

                event(new PasswordReset($customer));
            },
        );

        return $status === Password::PASSWORD_RESET
            ? redirect()->route('customer.auth.login')->with('status', __($status))
            : back()->withErrors(['email' => __($status)]);
    }
}
