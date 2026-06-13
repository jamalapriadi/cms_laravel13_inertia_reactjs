<?php

namespace App\Http\Controllers\Customer\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class CustomerVerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        if ($request->user('customer')->hasVerifiedEmail()) {
            return redirect()->intended(route('customer.dashboard', absolute: false).'?verified=1');
        }

        if ($request->user('customer')->markEmailAsVerified()) {
            event(new Verified($request->user('customer')));
        }

        return redirect()->intended(route('customer.dashboard', absolute: false).'?verified=1');
    }
}
