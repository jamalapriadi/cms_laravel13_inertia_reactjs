<?php

namespace App\Http\Middleware;

use App\Support\DashboardPermissions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDashboardPermission
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user, 403);

        $requiredPermissions = (array) DashboardPermissions::forRoute($request->route()?->getName());

        foreach ($requiredPermissions as $permission) {
            abort_unless($user->can($permission), 403);
        }

        return $next($request);
    }
}
