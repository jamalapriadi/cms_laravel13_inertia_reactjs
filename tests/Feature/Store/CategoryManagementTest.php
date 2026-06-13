<?php

use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function grantPermissions(User $user, array $permissions): User
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
 * @return array{
 *     phones: Category,
 *     iphone: Category,
 *     cases: Category,
 *     accessories: Category,
 *     fastCharger: Category
 * }
 */
function seedCategoryTree(): array
{
    $phones = Category::create([
        'name' => 'Phones',
        'slug' => 'phones-root',
        'sort_order' => 1,
        'is_publish' => true,
    ]);

    $iphone = Category::create([
        'name' => 'iPhone',
        'slug' => 'iphone',
        'parent_id' => $phones->id,
        'sort_order' => 2,
        'is_publish' => true,
    ]);

    $cases = Category::create([
        'name' => 'Cases',
        'slug' => 'cases',
        'parent_id' => $phones->id,
        'sort_order' => 3,
        'is_publish' => false,
    ]);

    $accessories = Category::create([
        'name' => 'Accessories',
        'slug' => 'accessories',
        'sort_order' => 4,
        'is_publish' => true,
    ]);

    $fastCharger = Category::create([
        'name' => 'Fast Charger',
        'slug' => 'fast-charger',
        'parent_id' => $accessories->id,
        'sort_order' => 5,
        'is_publish' => true,
    ]);

    Product::create([
        'category_id' => $iphone->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    Product::create([
        'category_id' => $iphone->id,
        'name' => 'iPhone 15 Pro',
        'slug' => 'iphone-15-pro',
        'condition' => 'new',
        'base_price' => 18000000,
        'is_publish' => true,
    ]);

    Product::create([
        'category_id' => $fastCharger->id,
        'name' => 'USB-C Fast Charger',
        'slug' => 'usb-c-fast-charger',
        'condition' => 'new',
        'base_price' => 300000,
        'is_publish' => true,
    ]);

    return compact('phones', 'iphone', 'cases', 'accessories', 'fastCharger');
}

/**
 * @return array<string, mixed>
 */
function inertiaProps(TestResponse $response): array
{
    /** @var array<string, mixed> $props */
    $props = $response->viewData('page')['props'];

    return $props;
}

test('user with category permission can view category list with summary and hierarchy data', function () {
    $user = grantPermissions(User::factory()->create(), ['categories.view']);

    seedCategoryTree();

    $response = $this
        ->actingAs($user)
        ->get(route('categories.index'));

    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('Dashboard/Store/Category/Index')
        ->where('categories.data.0.name', 'Phones')
        ->where('categories.data.0.children_count', 2)
        ->where('categories.data.0.children.0.name', 'iPhone')
        ->where('categories.data.1.parent.name', 'Phones')
        ->where('categories.data.1.hierarchy', 'Phones > iPhone')
        ->has('parentOptions', 5)
    );
});

test('user can filter categories by specific parent', function () {
    $user = grantPermissions(User::factory()->create(), ['categories.view']);

    $categories = seedCategoryTree();

    $response = $this
        ->actingAs($user)
        ->get(route('categories.index', ['parent_id' => $categories['phones']->id]));

    $props = inertiaProps($response);
    $rows = collect($props['categories']['data']);

    expect($props['filters']['parent_id'])->toBe($categories['phones']->id);
    expect($rows->pluck('name')->all())->toBe(['iPhone', 'Cases']);
    expect($rows->pluck('parent.name')->unique()->all())->toBe(['Phones']);
});

test('user can filter only parent and only child categories', function (
    string $type,
    array $expectedNames,
) {
    $user = grantPermissions(User::factory()->create(), ['categories.view']);

    seedCategoryTree();

    $response = $this
        ->actingAs($user)
        ->get(route('categories.index', ['type' => $type]));

    $rows = collect(inertiaProps($response)['categories']['data']);

    expect($rows->pluck('name')->all())->toBe($expectedNames);
})->with([
    'parent categories' => ['parent', ['Phones', 'Accessories']],
    'child categories' => ['child', ['iPhone', 'Cases', 'Fast Charger']],
]);

test('search can match category slug, parent name, and child name', function () {
    $user = grantPermissions(User::factory()->create(), ['categories.view']);

    seedCategoryTree();

    $slugResponse = $this
        ->actingAs($user)
        ->get(route('categories.index', ['search' => 'phones-root']));

    expect(collect(inertiaProps($slugResponse)['categories']['data'])->pluck('name')->all())
        ->toBe(['Phones', 'iPhone', 'Cases']);

    $parentResponse = $this
        ->actingAs($user)
        ->get(route('categories.index', ['search' => 'Phones']));

    expect(collect(inertiaProps($parentResponse)['categories']['data'])->pluck('name')->all())
        ->toBe(['Phones', 'iPhone', 'Cases']);

    $childResponse = $this
        ->actingAs($user)
        ->get(route('categories.index', ['search' => 'Fast Charger']));

    expect(collect(inertiaProps($childResponse)['categories']['data'])->pluck('name')->all())
        ->toBe(['Accessories', 'Fast Charger']);
});

test('category list pagination still works', function () {
    $user = grantPermissions(User::factory()->create(), ['categories.view']);

    foreach (range(1, 11) as $number) {
        Category::create([
            'name' => "Category {$number}",
            'slug' => "category-{$number}",
            'sort_order' => $number,
            'is_publish' => true,
        ]);
    }

    $response = $this
        ->actingAs($user)
        ->get(route('categories.index', ['page' => 2]));

    $props = inertiaProps($response);

    expect($props['categories']['current_page'])->toBe(2);
    expect($props['categories']['total'])->toBe(11);
    expect(count($props['categories']['data']))->toBe(1);
    expect($props['categories']['data'][0]['name'])->toBe('Category 11');
});

test('category deletion is blocked when the category still has children or products', function () {
    $user = grantPermissions(User::factory()->create(), ['categories.delete']);

    $categories = seedCategoryTree();

    $this
        ->actingAs($user)
        ->delete(route('categories.destroy', $categories['phones']))
        ->assertRedirect(route('categories.index'))
        ->assertSessionHas(
            'error',
            'Delete or move the child categories first before removing this category.',
        );

    $this->assertModelExists($categories['phones']);

    $this
        ->actingAs($user)
        ->delete(route('categories.destroy', $categories['iphone']))
        ->assertRedirect(route('categories.index'))
        ->assertSessionHas(
            'error',
            'Move or delete the products in this category before removing it.',
        );

    $this->assertModelExists($categories['iphone']);
});

test('empty leaf category can still be deleted', function () {
    $user = grantPermissions(User::factory()->create(), ['categories.delete']);

    $category = Category::create([
        'name' => 'Disposable Category',
        'slug' => 'disposable-category',
        'sort_order' => 99,
        'is_publish' => true,
    ]);

    $this
        ->actingAs($user)
        ->delete(route('categories.destroy', $category))
        ->assertRedirect(route('categories.index'))
        ->assertSessionHas('success', 'Category deleted successfully.');

    $this->assertSoftDeleted('categories', ['id' => $category->id]);
});

test('user can create category with description', function () {
    $user = grantPermissions(User::factory()->create(), ['categories.create']);

    $response = $this
        ->actingAs($user)
        ->post(route('categories.store'), [
            'name' => 'New Electronics',
            'description' => '<p>Amazing description for electronics</p>',
            'parent_id' => null,
            'sort_order' => 10,
            'show_home' => true,
            'is_publish' => true,
        ]);

    $response->assertRedirect(route('categories.index'));

    $category = Category::where('name', 'New Electronics')->first();
    expect($category)->not->toBeNull();
    expect($category->description)->toBe('<p>Amazing description for electronics</p>');
});

test('user can update category with description', function () {
    $user = grantPermissions(User::factory()->create(), ['categories.edit']);

    $category = Category::create([
        'name' => 'Old Category',
        'slug' => 'old-category',
        'description' => 'Old description',
        'sort_order' => 1,
        'is_publish' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->put(route('categories.update', $category), [
            'name' => 'Updated Category',
            'description' => '<p>Updated description text</p>',
            'parent_id' => null,
            'sort_order' => 2,
            'show_home' => false,
            'is_publish' => true,
        ]);

    $response->assertRedirect(route('categories.index'));

    $category->refresh();
    expect($category->name)->toBe('Updated Category');
    expect($category->description)->toBe('<p>Updated description text</p>');
});

test('api returns category description', function () {
    $category = Category::create([
        'name' => 'API Category',
        'slug' => 'api-category',
        'description' => '<p>API Category Description</p>',
        'sort_order' => 1,
        'is_publish' => true,
    ]);

    // Test API index (retrieves all published parent categories)
    $response = $this->get(route('api.v1.categories.index'));
    $response->assertSuccessful();

    // Test API show by slug
    $showResponse = $this->get(route('api.v1.categories.show', ['slug' => 'api-category']));
    $showResponse->assertSuccessful();

    $data = $showResponse->json('data');
    expect($data['description'])->toBe('<p>API Category Description</p>');
});
