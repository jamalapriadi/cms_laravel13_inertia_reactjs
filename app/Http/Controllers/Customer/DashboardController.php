<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $customer = $request->user('customer');

        return Inertia::render('Customer/Dashboard', [
            'customer' => [
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'last_login_at' => $customer->last_login_at?->toIso8601String(),
            ],
            'summary' => [
                'orders' => $customer->orders()->count(),
                'carts' => $customer->carts()->count(),
            ],
        ]);
    }
}
