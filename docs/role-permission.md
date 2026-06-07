# Dashboard Role & Permission

Dashboard authorization uses `spatie/laravel-permission` with the `web` guard.

## Setup

Run migrations and seed the role catalog:

```bash
php artisan migrate
php artisan db:seed --class=RolePermissionSeeder
```

The full dashboard seeder also calls `RolePermissionSeeder` through `DatabaseSeeder`.

## Source Of Truth

Permissions, role defaults, and dashboard route mappings live in:

```text
app/Support/DashboardPermissions.php
```

Add new dashboard permissions there first, then rerun the seeder.

## Roles

- `super-admin`: all permissions.
- `owner`: broad read and operational access, including reports/settings views.
- `admin`: most dashboard permissions except sensitive permission deletion and technical settings updates.
- `staff`: operational read access for common ecommerce workflows.
- `warehouse`: product, stock, inventory, supplier, incoming goods, returns, and shipping.
- `cashier`: order, customer, cart, payment, shipping, and transactional workflows.
- `customer-service`: customer, order, payment visibility, customer account support, FAQ/site content visibility.

## Permission Pattern

Permissions use `module.action`, for example:

```text
dashboard.view
products.view
products.create
products.edit
products.delete
products.import
products.export
orders.view
orders.detail
orders.update-status
roles.assign-permission
users.assign-role
media.upload
api-documentation.view
```

The complete generated list is available from:

```bash
php artisan tinker
App\Support\DashboardPermissions::all()
```

## Backend Usage

All `/dashboard/*` routes are protected by `dashboard.permission` in `routes/web.php`.
The middleware resolves the current route name through `DashboardPermissions::forRoute()` and checks the authenticated user server-side.

For one-off routes, use Spatie middleware directly:

```php
Route::post('/dashboard/products/import', ProductImportController::class)
    ->middleware('permission:products.import');
```

## Frontend Usage

Inertia shares authenticated roles and permissions under:

```ts
auth.user.roles
auth.user.permissions
```

Reusable helpers live in:

```text
resources/js/lib/permissions.ts
```

Example:

```tsx
import { usePermission } from '@/lib/permissions';

const { hasPermission } = usePermission();

{hasPermission('products.create') && <Button>Create Product</Button>}
```

The dashboard sidebar uses permission filtering and shows a parent menu when at least one child is allowed.

## Safety Rules

- Frontend checks are only for UX. Backend route middleware is the security boundary.
- `super-admin` cannot be deleted or renamed.
- The last active `super-admin` cannot be removed, deactivated, or deleted.
- Only a `super-admin` can assign the `super-admin` role to another user.
- Spatie permission cache is cleared by the seeder and after role/permission/user role mutations.

## Troubleshooting

If permissions do not update immediately:

```bash
php artisan permission:cache-reset
php artisan optimize:clear
```

If frontend route helpers are stale after route changes:

```bash
php artisan wayfinder:generate --no-interaction
```
