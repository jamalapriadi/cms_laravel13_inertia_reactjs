<?php

namespace App\Http\Controllers\Customer\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerAuth\CustomerRegisterRequest;
use App\Models\Shop\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CustomerRegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Customer/Auth/Register');
    }

    public function store(CustomerRegisterRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());

        Auth::guard('customer')->login($customer);
        $request->session()->regenerate();

        return redirect()->route('customer.dashboard');
    }
}
