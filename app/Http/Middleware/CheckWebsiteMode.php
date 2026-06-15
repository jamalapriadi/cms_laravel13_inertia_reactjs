<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckWebsiteMode
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $menuKey): Response
    {
        $websiteMode = get_option('website_mode', 'commerce');

        if ($websiteMode === 'commerce') {
            return $next($request);
        }

        if ($websiteMode === 'blog') {
            abort(403, 'Akses ditolak. Fitur E-Commerce dinonaktifkan dalam mode Blog / Company Profile.');
        }

        if ($websiteMode === 'simple_blog_commerce') {
            $enabledMenus = get_option('enabled_ecommerce_menus', []);
            if (! is_array($enabledMenus)) {
                $enabledMenus = [];
            }

            if (! in_array($menuKey, $enabledMenus)) {
                abort(403, 'Akses ditolak. Fitur ini dinonaktifkan.');
            }
        }

        return $next($request);
    }
}
