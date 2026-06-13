# Laravel Dynamic Content Builder

Reusable Dynamic Content Builder for Laravel projects that use InertiaJS and ReactJS.

## Install

```bash
composer require jamalapriadi/laravel-dynamic-content-builder
php artisan dynamic-content-builder:install
php artisan migrate
php artisan storage:link
```

## Published assets

The install command publishes:

- `config/dynamic-content-builder.php`
- package migrations
- Inertia React starter assets to `resources/js`

## Default routes

- Dashboard content types: `/dashboard/content-types`
- Dashboard custom fields: `/dashboard/custom-fields`
- Dashboard entries: `/dashboard/content/{content_type_slug}`
- API content types: `/api/v1/content-types`
- API entries: `/api/v1/content/{content_type_slug}`

## Fresh Laravel installer notes

This package ships with publishable Inertia React assets so a fresh Laravel installer does not need app-specific UI components or media modules before using the builder.
