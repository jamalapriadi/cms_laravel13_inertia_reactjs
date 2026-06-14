<?php

namespace App\CMS\Themes;

use Illuminate\Routing\Route as RouteDefinition;
use Illuminate\Routing\Router;

class FallbackAdminLoginViewData
{
    public function __construct(
        private readonly Router $router,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function data(): array
    {
        return [
            'action' => $this->loginAction(),
            'admin_login_url' => $this->adminLoginUrl(),
            'field' => $this->loginField(),
            'password_field' => 'password',
            'remember_field' => 'remember',
            'remember_supported' => true,
            'forgot_password_url' => $this->forgotPasswordUrl(),
        ];
    }

    public function adminLoginUrl(): string
    {
        foreach (['login', 'admin.login'] as $name) {
            $route = $this->routeByNameAndMethod($name, 'GET');

            if ($route instanceof RouteDefinition) {
                return route($name);
            }
        }

        $route = $this->routeByUriAndMethod('my-admin/login', 'GET');

        if ($route instanceof RouteDefinition) {
            return $route->getName() ? route($route->getName()) : url('/my-admin/login');
        }

        foreach (['customer.auth.login'] as $name) {
            $route = $this->routeByNameAndMethod($name, 'GET');

            if ($route instanceof RouteDefinition) {
                return route($name);
            }
        }

        $route = $this->routeByUriAndMethod('auth/login', 'GET');

        if ($route instanceof RouteDefinition) {
            return $route->getName() ? route($route->getName()) : url('/auth/login');
        }

        return url('/my-admin/login');
    }

    private function loginAction(): string
    {
        foreach (['customer.auth.login.store', 'auth.login', 'login.store', 'login'] as $name) {
            $route = $this->routeByNameAndMethod($name, 'POST');

            if ($route instanceof RouteDefinition) {
                return route($name);
            }
        }

        $route = $this->routeByUriAndMethod('auth/login', 'POST');

        if ($route instanceof RouteDefinition) {
            return $route->getName() ? route($route->getName()) : url('/auth/login');
        }

        $route = $this->routeByUriAndMethod('login', 'POST');

        if ($route instanceof RouteDefinition) {
            return $route->getName() ? route($route->getName()) : url('/login');
        }

        return url('/auth/login');
    }

    private function loginField(): string
    {
        if (
            $this->routeByNameAndMethod('customer.auth.login.store', 'POST') instanceof RouteDefinition
            || $this->routeByUriAndMethod('auth/login', 'POST') instanceof RouteDefinition
        ) {
            return 'email';
        }

        return (string) config('fortify.username', 'email');
    }

    private function forgotPasswordUrl(): ?string
    {
        foreach (['customer.auth.password.request', 'password.request'] as $name) {
            $route = $this->routeByNameAndMethod($name, 'GET');

            if ($route instanceof RouteDefinition) {
                return route($name);
            }
        }

        if ($this->routeByUriAndMethod('auth/forgot-password', 'GET') instanceof RouteDefinition) {
            return url('/auth/forgot-password');
        }

        if ($this->routeByUriAndMethod('forgot-password', 'GET') instanceof RouteDefinition) {
            return url('/forgot-password');
        }

        return null;
    }

    private function routeByNameAndMethod(string $name, string $method): ?RouteDefinition
    {
        $route = $this->router->getRoutes()->getByName($name);

        if (! $route instanceof RouteDefinition) {
            return null;
        }

        return in_array($method, $route->methods(), true) ? $route : null;
    }

    private function routeByUriAndMethod(string $uri, string $method): ?RouteDefinition
    {
        foreach ($this->router->getRoutes() as $route) {
            if (! $route instanceof RouteDefinition) {
                continue;
            }

            if ($route->uri() !== ltrim($uri, '/')) {
                continue;
            }

            if (in_array($method, $route->methods(), true)) {
                return $route;
            }
        }

        return null;
    }
}
