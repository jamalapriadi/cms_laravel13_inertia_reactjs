<?php

use App\Models\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function grantBrandPermissions(User $user, array $permissions): User
{
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);

    app(PermissionRegistrar::class)->forgetCachedPermissions();

    return $user->refresh();
}

/**
 * @return array<string, mixed>
 */
function brandInertiaProps(TestResponse $response): array
{
    /** @var array<string, mixed> $props */
    $props = $response->viewData('page')['props'];

    return $props;
}

test('authenticated user can view brand list with summary metrics', function () {
    $user = grantBrandPermissions(User::factory()->create(), ['brands.view']);

    $category = Category::create([
        'name' => 'Phones',
        'slug' => 'phones',
        'is_publish' => true,
    ]);

    $apple = Brand::create([
        'name' => 'Apple',
        'slug' => 'apple',
        'is_active' => true,
    ]);

    $sony = Brand::create([
        'name' => 'Sony',
        'slug' => 'sony',
        'is_active' => true,
    ]);

    Brand::create([
        'name' => 'Xiaomi',
        'slug' => 'xiaomi',
        'is_active' => true,
    ]);

    Product::create([
        'category_id' => $category->id,
        'brand_id' => $apple->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    Product::create([
        'category_id' => $category->id,
        'brand_id' => $apple->id,
        'name' => 'AirPods Pro',
        'slug' => 'airpods-pro',
        'condition' => 'new',
        'base_price' => 3500000,
        'is_publish' => true,
    ]);

    Product::create([
        'category_id' => $category->id,
        'brand_id' => $sony->id,
        'name' => 'Sony XM5',
        'slug' => 'sony-xm5',
        'condition' => 'new',
        'base_price' => 5500000,
        'is_publish' => true,
    ]);

    Product::create([
        'category_id' => $category->id,
        'brand_id' => null,
        'name' => 'Generic Cable',
        'slug' => 'generic-cable',
        'condition' => 'new',
        'base_price' => 150000,
        'is_publish' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('brands.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/Brand/Index')
        ->where('summary.brands', 3)
        ->where('summary.products', 3)
    );

    $rows = collect(brandInertiaProps($response)['brands']['data'])->keyBy('name');

    expect($rows)->toHaveCount(3)
        ->and($rows->get('Apple')['products_count'])->toBe(2)
        ->and($rows->get('Sony')['products_count'])->toBe(1)
        ->and($rows->get('Xiaomi')['products_count'])->toBe(0);
});
