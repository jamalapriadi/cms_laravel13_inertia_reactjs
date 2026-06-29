<?php

namespace App\Support;

final class DashboardPermissions
{
    /**
     * @return array<string, string[]>
     */
    public static function modules(): array
    {
        return [
            'dashboard' => ['view'],
            'provinces' => ['view', 'create', 'edit', 'delete'],
            'kabupatens' => ['view', 'create', 'edit', 'delete'],
            'kecamatans' => ['view', 'create', 'edit', 'delete'],
            'kelurahans' => ['view', 'create', 'edit', 'delete'],
            'menus' => ['view', 'create', 'edit', 'delete', 'builder'],
            'roles' => ['view', 'create', 'edit', 'delete', 'assign-permission'],
            'permissions' => ['view', 'create', 'edit', 'delete'],
            'users' => ['view', 'create', 'edit', 'delete', 'assign-role', 'update-status'],
            'post-categories' => ['view', 'create', 'edit', 'delete'],
            'taxonomies' => ['view', 'create', 'edit', 'delete'],
            'posts' => ['view', 'create', 'edit', 'delete', 'translate'],
            'pages' => ['view', 'create', 'edit', 'delete', 'translate'],
            'content-types' => ['view', 'create', 'edit', 'delete'],
            'custom-fields' => ['view', 'create', 'edit', 'delete'],
            'dynamic-contents' => ['view', 'create', 'edit', 'delete'],
            'packages' => ['view', 'create', 'edit', 'delete'],
            'brands' => ['view', 'create', 'edit', 'delete'],
            'units' => ['view', 'create', 'edit', 'delete'],
            'categories' => ['view', 'create', 'edit', 'delete'],
            'products' => ['view', 'create', 'edit', 'delete', 'import', 'export'],
            'product-variants' => ['view', 'create', 'edit', 'delete'],
            'variant-items' => ['view', 'create', 'edit', 'delete'],
            'product-stock-units' => ['view', 'create', 'edit', 'delete', 'barcode', 'print-barcode'],
            'product-images' => ['view', 'create', 'edit', 'delete'],
            'product-collections' => ['view', 'create', 'edit', 'delete', 'manage-items'],
            'product-specifications' => ['view', 'create', 'edit', 'delete'],
            'faqs' => ['view', 'create', 'edit', 'delete'],
            'banner-slides' => ['view', 'create', 'edit', 'delete'],
            'customers' => ['view', 'delete', 'update-status', 'reset-password'],
            'carts' => ['view', 'create', 'edit', 'delete', 'manage-items'],
            'cash-movements' => ['view', 'view-all', 'create', 'cash-in', 'cash-out', 'expense', 'owner-withdrawal', 'adjustment', 'approve', 'reject', 'cancel', 'cancel-approved'],
            'payments' => ['view', 'detail', 'confirm', 'refund'],
            'stock-movements' => ['view', 'create', 'edit', 'delete'],
            'shippings' => ['view', 'create', 'edit', 'delete'],
            'suppliers' => ['view', 'create', 'edit', 'delete'],
            'incoming-goods' => ['view', 'create', 'edit', 'delete', 'print-barcode'],
            'supplier-returns' => ['view', 'create', 'edit', 'delete'],
            'orders' => ['view', 'detail', 'create', 'edit', 'delete', 'update-status', 'export', 'refund'],
            'settings' => ['view', 'update'],
            'themes' => ['view', 'create', 'edit', 'delete'],
            'site-contents' => ['view', 'create', 'edit', 'delete'],
            'options' => ['view', 'create', 'edit', 'delete'],
            'media' => ['view', 'upload', 'edit', 'delete'],
            'api-documentation' => ['view'],
            'cashier' => [
                'price_override',
                'price_override.approve',
                'discount.apply',
                'discount.approve',
                'discount.approve_high_value',
                'discount.view_approvals',
                'discount.manage_approvals',
                'reports.daily.view',
                'reports.daily.view_all',
            ],
        ];
    }

    /**
     * @return string[]
     */
    public static function all(): array
    {
        $permissions = [];

        foreach (self::modules() as $module => $actions) {
            foreach ($actions as $action) {
                $permissions[] = "{$module}.{$action}";
            }
        }

        return $permissions;
    }

    /**
     * @return array<string, string[]>
     */
    public static function roles(): array
    {
        return [
            'super-admin' => self::all(),
            'owner' => self::permissionsForModules([
                'dashboard',
                'provinces',
                'kabupatens',
                'kecamatans',
                'kelurahans',
                'menus',
                'users',
                'post-categories',
                'taxonomies',
                'posts',
                'pages',
                'content-types',
                'custom-fields',
                'dynamic-contents',
                'packages',
                'brands',
                'units',
                'categories',
                'products',
                'product-variants',
                'variant-items',
                'product-stock-units',
                'product-images',
                'product-collections',
                'product-specifications',
                'faqs',
                'banner-slides',
                'cash-movements',
                'customers',
                'carts',
                'payments',
                'stock-movements',
                'shippings',
                'suppliers',
                'incoming-goods',
                'supplier-returns',
                'orders',
                'settings',
                'site-contents',
                'options',
                'media',
                'api-documentation',
                'cashier',
            ]),
            'admin' => self::except(self::all(), [
                'roles.delete',
                'permissions.create',
                'permissions.edit',
                'permissions.delete',
                'settings.update',
            ]),
            'staff' => self::permissionsForModules([
                'dashboard',
                'products',
                'product-stock-units',
                'product-collections',
                'cash-movements',
                'customers',
                'carts',
                'orders',
                'payments',
                'shippings',
                'media',
            ], ['view', 'detail', 'upload']),
            'warehouse' => self::permissionsForModules([
                'dashboard',
                'brands',
                'units',
                'categories',
                'products',
                'product-variants',
                'variant-items',
                'product-stock-units',
                'product-images',
                'stock-movements',
                'shippings',
                'suppliers',
                'incoming-goods',
                'supplier-returns',
                'media',
            ]),
            'cashier' => array_merge(
                self::permissionsForModules([
                    'dashboard',
                    'cash-movements',
                    'customers',
                    'carts',
                    'orders',
                    'payments',
                    'shippings',
                    'products',
                    'product-stock-units',
                ], ['view', 'detail', 'create', 'edit', 'update-status', 'confirm', 'refund', 'cash-in', 'cash-out', 'expense', 'cancel']),
                [
                    'cashier.discount.apply',
                    'cashier.discount.view_approvals',
                    'cashier.reports.daily.view',
                ]
            ),
            'customer-service' => self::permissionsForModules([
                'dashboard',
                'customers',
                'carts',
                'orders',
                'payments',
                'shippings',
                'faqs',
                'site-contents',
            ], ['view', 'detail', 'edit', 'update-status', 'reset-password']),
        ];
    }

    public static function forRoute(?string $routeName): string|array|null
    {
        if ($routeName === null) {
            return 'dashboard.view';
        }

        $explicit = [
            'dashboard' => 'dashboard.view',
            'menus.builder' => 'menus.builder',
            'menus.builder.update' => ['menus.builder', 'menus.edit'],
            'users.toggle-status' => 'users.update-status',
            'taxonomies.index' => 'taxonomies.view',
            'taxonomies.create' => 'taxonomies.create',
            'taxonomies.store' => 'taxonomies.create',
            'taxonomies.edit' => 'taxonomies.edit',
            'taxonomies.update' => 'taxonomies.edit',
            'taxonomies.destroy' => 'taxonomies.delete',
            'posts.usage-guide' => 'posts.view',
            'posts.auto-save' => 'posts.create',
            'posts.auto-save-update' => 'posts.edit',
            'pages.auto-save' => 'pages.create',
            'pages.auto-save-update' => 'pages.edit',
            'custom-fields.fields.store' => 'custom-fields.create',
            'custom-fields.fields.update' => 'custom-fields.edit',
            'custom-fields.fields.destroy' => 'custom-fields.delete',
            'custom-fields.fields.move' => 'custom-fields.edit',
            'dynamic-content.index' => 'dynamic-contents.view',
            'dynamic-content.create' => 'dynamic-contents.create',
            'dynamic-content.store' => 'dynamic-contents.create',
            'dynamic-content.edit' => 'dynamic-contents.edit',
            'dynamic-content.update' => 'dynamic-contents.edit',
            'dynamic-content.destroy' => 'dynamic-contents.delete',
            'dashboard.cms.posts.translations.index' => 'posts.view',
            'dashboard.cms.posts.translations.edit' => 'posts.translate',
            'dashboard.cms.posts.translations.update' => 'posts.translate',
            'dashboard.cms.pages.translations.index' => 'pages.view',
            'dashboard.cms.pages.translations.edit' => 'pages.translate',
            'dashboard.cms.pages.translations.update' => 'pages.translate',
            'ecommerce.search-options' => 'products.view',
            'products.import' => 'products.import',
            'products.template' => 'products.import',
            'products.export' => 'products.export',
            'product-stock-units.barcode.generate' => 'product-stock-units.barcode',
            'product-stock-units.barcode.regenerate' => 'product-stock-units.barcode',
            'product-stock-units.bulk-generate-barcode' => 'product-stock-units.barcode',
            'product-stock-units.barcodes.print' => 'product-stock-units.print-barcode',
            'product-stock-units.barcodes.print-selected' => 'product-stock-units.print-barcode',
            'incoming-goods.barcodes.print' => 'incoming-goods.print-barcode',
            'barcode-scanner.index' => 'product-stock-units.view',
            'barcode-scanner.search' => 'product-stock-units.view',
            'product-collections.options.products' => 'product-collections.view',
            'product-collections.items.store' => 'product-collections.manage-items',
            'product-collections.items.update' => 'product-collections.manage-items',
            'product-collections.items.destroy' => 'product-collections.manage-items',
            'customers.toggle-login' => 'customers.update-status',
            'customers.reset-password' => 'customers.reset-password',
            'carts.destroy-item' => 'carts.manage-items',
            'orders.receipt' => 'orders.detail',
            'config.main' => 'settings.view',
            'config.general' => 'settings.view',
            'config.preferences' => 'settings.view',
            'config.management' => 'settings.view',
            'config.customer' => 'settings.view',
            'config.media' => 'settings.view',
            'config.socialite' => 'settings.view',
            'config.language' => 'settings.view',
            'config.language.update' => 'settings.update',
            'themes.activate' => 'themes.edit',
            'themes.customize' => 'themes.edit',
            'themes.customize.update' => 'themes.edit',
            'config.site-contents.usage' => 'site-contents.view',
            'config.reading' => 'settings.view',
            'dashboard.media' => 'media.view',
            'dashboard.media.library' => 'media.view',
            'dashboard.media.create' => 'media.upload',
            'dashboard.media.store' => 'media.upload',
            'dashboard.media.upload' => 'media.upload',
            'dashboard.media.json' => 'media.upload',
            'dashboard.media.storage-file.destroy' => 'media.delete',
            'dashboard.media.update' => 'media.edit',
            'dashboard.media.destroy' => 'media.delete',
            'dashboard.media.store-image' => 'media.upload',
            'dashboard.cashier.cash-movements.index' => 'cash-movements.view',
            'dashboard.cashier.cash-movements.create' => 'cash-movements.create',
            'dashboard.cashier.cash-movements.store' => 'cash-movements.create',
            'dashboard.cashier.cash-movements.show' => 'cash-movements.view',
            'dashboard.cashier.cash-movements.approve' => 'cash-movements.approve',
            'dashboard.cashier.cash-movements.reject' => 'cash-movements.reject',
            'dashboard.cashier.cash-movements.cancel' => 'cash-movements.cancel',
            'dashboard.cashier.pricing.preview' => 'cashier.discount.apply',
            'dashboard.cashier.discount-approvals.index' => 'cashier.discount.view_approvals',
            'dashboard.cashier.discount-approvals.show' => 'cashier.discount.view_approvals',
            'dashboard.cashier.discount-approvals.store' => 'cashier.discount.apply',
            'dashboard.cashier.discount-approvals.approve' => 'cashier.discount.approve',
            'dashboard.cashier.discount-approvals.reject' => 'cashier.discount.approve',
            'dashboard.cashier.reports.daily' => 'cashier.reports.daily.view',
            'dashboard.cashier.reports.daily.print' => 'cashier.reports.daily.view',
            'dashboard.cashier.reports.daily.export' => 'cashier.reports.daily.view',
        ];

        if (array_key_exists($routeName, $explicit)) {
            return $explicit[$routeName];
        }

        $resourceModules = [
            'provinces',
            'kabupatens',
            'kecamatans',
            'kelurahans',
            'menus',
            'roles',
            'permissions',
            'users',
            'post-categories',
            'posts',
            'pages',
            'content-types',
            'custom-fields',
            'packages',
            'brands',
            'units',
            'categories',
            'products',
            'product-variants',
            'variant-items',
            'product-stock-units',
            'product-images',
            'product-collections',
            'product-specifications',
            'faqs',
            'banner-slides',
            'cash-movements',
            'customers',
            'carts',
            'payments',
            'stock-movements',
            'shippings',
            'suppliers',
            'incoming-goods',
            'supplier-returns',
            'orders',
            'themes',
            'options',
        ];

        foreach ($resourceModules as $module) {
            if (str_starts_with($routeName, "{$module}.")) {
                return self::resourceRoutePermission($module, substr($routeName, strlen($module) + 1));
            }
        }

        if (str_starts_with($routeName, 'config.site-contents.')) {
            return self::resourceRoutePermission('site-contents', substr($routeName, strlen('config.site-contents') + 1));
        }

        return 'dashboard.view';
    }

    private static function resourceRoutePermission(string $module, string $action): string|array
    {
        return match ($action) {
            'index' => "{$module}.view",
            'show' => in_array($module, ['orders', 'payments'], true)
                ? "{$module}.detail"
                : "{$module}.view",
            'create', 'store' => "{$module}.create",
            'edit', 'update' => $module === 'roles'
                ? ['roles.edit', 'roles.assign-permission']
                : "{$module}.edit",
            'destroy' => "{$module}.delete",
            default => "{$module}.view",
        };
    }

    /**
     * @param  string[]  $modules
     * @param  string[]|null  $actions
     * @return string[]
     */
    private static function permissionsForModules(array $modules, ?array $actions = null): array
    {
        $permissions = [];

        foreach ($modules as $module) {
            foreach (self::modules()[$module] ?? [] as $action) {
                if ($actions === null || in_array($action, $actions, true)) {
                    $permissions[] = "{$module}.{$action}";
                }
            }
        }

        return $permissions;
    }

    /**
     * @param  string[]  $permissions
     * @param  string[]  $excluded
     * @return string[]
     */
    private static function except(array $permissions, array $excluded): array
    {
        return array_values(array_diff($permissions, $excluded));
    }
}
