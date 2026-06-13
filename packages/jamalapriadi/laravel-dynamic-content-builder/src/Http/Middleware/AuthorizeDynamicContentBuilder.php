<?php

namespace Jamalapriadi\DynamicContentBuilder\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AuthorizeDynamicContentBuilder
{
    public function handle(Request $request, Closure $next, string $permission)
    {
        if (! config('dynamic-content-builder.authorization.enabled', false)) {
            return $next($request);
        }

        $user = $request->user();

        abort_unless($user, 403);
        abort_unless(method_exists($user, 'can') && $user->can($permission), 403);

        return $next($request);
    }
}
