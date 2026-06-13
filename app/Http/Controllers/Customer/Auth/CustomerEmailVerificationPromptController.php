<?php

namespace App\Http\Controllers\Customer\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerEmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     */
    public function __invoke(Request $request): RedirectResponse|Response
    {
        return $request->user('customer')->hasVerifiedEmail()
                    ? redirect()->route('customer.dashboard')
                    : Inertia::render('Customer/Auth/VerifyEmail', ['status' => session('status')]);
    }
}
