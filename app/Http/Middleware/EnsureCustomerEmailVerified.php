<?php

namespace App\Http\Middleware;

use App\Services\Customer\CustomerConfigService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class EnsureCustomerEmailVerified
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
    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->configService->isEmailVerificationRequired()) {
            return $next($request);
        }

        $user = $request->user('customer');

        if (! $user || ! $user->hasVerifiedEmail()) {
            if ($request->expectsJson()) {
                abort(403, 'Your email address is not verified.');
            }

            return Redirect::guest(URL::route('customer.auth.verification.notice'));
        }

        return $next($request);
    }
}
