<?php

use App\Models\User;
use App\Services\Dashboard\OptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    Permission::findOrCreate('dashboard.view', 'web');
    $this->user->givePermissionTo('dashboard.view');
});

test('dashboard under commerce mode returns all e-commerce metrics', function () {
    app(OptionService::class)->store([
        'website_mode' => 'commerce',
    ]);

    $response = $this->actingAs($this->user)->get('/my-admin/dashboard');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Dashboard/Index')
        ->has('metrics')
        ->has('charts')
        ->has('tables')
        ->where('metrics.total_revenue', 0)
        ->where('metrics.total_orders', 0)
    );
});

test('dashboard under blog mode returns empty/zero for all e-commerce metrics', function () {
    app(OptionService::class)->store([
        'website_mode' => 'blog',
    ]);

    $response = $this->actingAs($this->user)->get('/my-admin/dashboard');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Dashboard/Index')
        ->where('metrics.total_revenue', 0)
        ->where('metrics.total_orders', 0)
        ->where('metrics.available_stock_units', 0)
        ->where('metrics.pending_payments', 0)
        ->where('metrics.total_products', 0)
        ->where('metrics.total_brands', 0)
        ->where('metrics.total_suppliers', 0)
        ->where('charts.revenue_growth', [])
        ->where('charts.order_status', [])
        ->where('charts.payment_status', [])
        ->where('charts.sales_by_category', [])
        ->where('charts.sales_by_brand', [])
        ->where('charts.stock_unit_summary', [])
        ->where('tables.top_selling_products', [])
        ->where('tables.low_stock_products', [])
        ->where('tables.recent_orders', [])
        ->where('tables.pending_payments', [])
        ->where('tables.damaged_stock_units', [])
    );
});

test('dashboard under simple_blog_commerce mode only returns metrics for enabled menus', function () {
    app(OptionService::class)->store([
        'website_mode' => 'simple_blog_commerce',
        'enabled_ecommerce_menus' => ['products', 'orders'],
    ]);

    $response = $this->actingAs($this->user)->get('/my-admin/dashboard');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Dashboard/Index')
        ->where('metrics.total_revenue', 0)
        ->where('metrics.total_orders', 0)
        ->where('metrics.total_products', 0)
        ->where('metrics.available_stock_units', 0)
        ->where('metrics.pending_payments', 0)
        ->where('metrics.total_brands', 0)
        ->where('metrics.total_suppliers', 0)
        ->has('charts.revenue_growth')
        ->has('charts.order_status')
        ->where('charts.payment_status', [])
        ->where('charts.stock_unit_summary', [])
        ->has('tables.top_selling_products')
        ->has('tables.low_stock_products')
        ->has('tables.recent_orders')
        ->where('tables.pending_payments', [])
        ->where('tables.damaged_stock_units', [])
    );
});
