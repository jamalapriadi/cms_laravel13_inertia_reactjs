<?php

namespace App\Http\Middleware;

use App\Services\Customer\CustomerConfigService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCustomerAuthFeatureEnabled
{
    protected CustomerConfigService $configService;

    public function __construct(CustomerConfigService $configService)
    {
        $this->configService = $configService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $enabled = match ($feature) {
            'registration' => $this->configService->isRegistrationAllowed(),
            'login' => $this->configService->isLoginAllowed(),
            'password_reset' => $this->configService->isPasswordResetAllowed(),
            default => true,
        };

        if (! $enabled) {
            $message = match ($feature) {
                'registration' => 'Registrasi customer saat ini sedang dinonaktifkan.',
                'login' => 'Login customer saat ini sedang dinonaktifkan.',
                'password_reset' => 'Reset password customer saat ini sedang dinonaktifkan.',
                default => 'Fitur saat ini sedang dinonaktifkan.',
            };

            // If the user tries to login but login is disabled, redirect to home page
            if ($feature === 'login') {
                return redirect()->route('home')->with('error', $message);
            }

            // For other features like registration or password reset, redirect to login page
            return redirect()->route('customer.auth.login')->with('error', $message);
        }

        return $next($request);
    }
}
