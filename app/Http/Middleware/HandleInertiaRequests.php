<?php

namespace App\Http\Middleware;

use App\Models\ContentType;
use App\Services\Customer\CustomerConfigService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user('web');
        $customer = $request->user('customer');
        $customerConfig = app(CustomerConfigService::class);

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'customer_auth_config' => $customerConfig->getAllConfigs(),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'two_factor_enabled' => $user->hasEnabledTwoFactorAuthentication(),
                    'roles' => method_exists($user, 'getRoleNames')
                        ? $user->getRoleNames()->values()
                        : [],
                    'permissions' => method_exists($user, 'getAllPermissions')
                        ? $user->getAllPermissions()->pluck('name')->values()
                        : [],
                ] : null,
                'permissions' => $user && method_exists($user, 'getAllPermissions')
                    ? $user->getAllPermissions()->pluck('name')
                    : [],
            ],
            'customerAuth' => [
                'customer' => $customer ? [
                    'id' => $customer->getKey(),
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                ] : null,
            ],
            'mediaUrlBase' => rtrim((string) config('filesystems.disks.public.url'), '/'),
            'dynamicContentTypes' => $user && Schema::hasTable('content_types')
                ? ContentType::query()
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get(['id', 'name', 'slug', 'icon'])
                    ->map(fn (ContentType $contentType) => [
                        'id' => $contentType->id,
                        'name' => $contentType->name,
                        'slug' => $contentType->slug,
                        'icon' => $contentType->icon,
                    ])
                    ->values()
                    ->all()
                : [],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
