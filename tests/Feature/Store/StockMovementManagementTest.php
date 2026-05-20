<?php

use App\Models\Brand;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductVariant;
use App\Models\Shop\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createBaseProductAndVariant(): ProductVariant
{
    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $brand = Brand::create([
        'name' => 'Apple',
        'slug' => 'apple',
        'is_active' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    return ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'iPhone 15 Pro Max 256GB Black',
        'sku' => 'IPH15PM-256-BLK',
        'price' => 20000000,
        'track_stock' => true,
        'stock' => 10,
    ]);
}

test('authenticated user can view stock movements list with summary metrics', function () {
    $user = User::factory()->create();
    $variant = createBaseProductAndVariant();

    StockMovement::create([
        'product_variant_id' => $variant->id,
        'type' => 'purchase',
        'qty' => 30,
        'stock_before' => 0,
        'stock_after' => 30,
        'note' => 'Purchase batch',
    ]);

    StockMovement::create([
        'product_variant_id' => $variant->id,
        'type' => 'sale',
        'qty' => 5,
        'stock_before' => 30,
        'stock_after' => 25,
        'note' => 'Sold 5',
    ]);

    $response = $this->actingAs($user)
        ->get('/dashboard/ecommerce/stock-movements');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/StockMovement/Index')
        ->has('summary')
        ->where('summary.total_movements', 2)
        ->where('summary.stock_in', 30)
        ->where('summary.stock_out', 5)
        ->where('summary.net_change', 25)
    );
});

test('user can filter stock movements', function () {
    $user = User::factory()->create();
    $variant = createBaseProductAndVariant();

    StockMovement::create([
        'product_variant_id' => $variant->id,
        'type' => 'purchase',
        'qty' => 10,
        'stock_before' => 0,
        'stock_after' => 10,
        'note' => 'First batch',
    ]);

    StockMovement::create([
        'product_variant_id' => $variant->id,
        'type' => 'sale',
        'qty' => 2,
        'stock_before' => 10,
        'stock_after' => 8,
        'note' => 'Sale text',
    ]);

    // Filter by type = sale
    $response = $this->actingAs($user)
        ->get('/dashboard/ecommerce/stock-movements?type=sale');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/StockMovement/Index')
        ->has('movements.data', 1)
        ->where('movements.data.0.note', 'Sale text')
    );

    // Filter by search = First
    $response = $this->actingAs($user)
        ->get('/dashboard/ecommerce/stock-movements?search=First');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Store/StockMovement/Index')
        ->has('movements.data', 1)
        ->where('movements.data.0.note', 'First batch')
    );
});

test('user can create a stock movement', function () {
    $user = User::factory()->create();
    $variant = createBaseProductAndVariant();

    $variant->update(['stock' => 10]);

    // Store purchase type
    $response = $this->actingAs($user)
        ->post('/dashboard/ecommerce/stock-movements', [
            'product_variant_id' => $variant->id,
            'type' => 'purchase',
            'qty' => 5,
            'note' => 'Stock purchased',
        ]);

    $response->assertRedirect('/dashboard/ecommerce/stock-movements');
    $this->assertDatabaseHas('stock_movements', [
        'product_variant_id' => $variant->id,
        'type' => 'purchase',
        'qty' => 5,
        'stock_before' => 10,
        'stock_after' => 15,
        'note' => 'Stock purchased',
    ]);

    // Assert variant stock was increased
    $this->assertEquals(15, $variant->fresh()->stock);

    // Store sale type
    $response = $this->actingAs($user)
        ->post('/dashboard/ecommerce/stock-movements', [
            'product_variant_id' => $variant->id,
            'type' => 'sale',
            'qty' => 3,
            'note' => 'Customer order',
        ]);

    $response->assertRedirect('/dashboard/ecommerce/stock-movements');
    $this->assertEquals(12, $variant->fresh()->stock);
});

test('user can update stock movement and recalculate variant stock levels', function () {
    $user = User::factory()->create();
    $variant = createBaseProductAndVariant();

    // Setup initial stock = 100
    $variant->update(['stock' => 100]);

    $movement = StockMovement::create([
        'product_variant_id' => $variant->id,
        'type' => 'purchase',
        'qty' => 20, // should have added 20 to variant stock (so variant stock is 100)
        'stock_before' => 80,
        'stock_after' => 100,
        'note' => 'Initial purchase',
    ]);

    // Edit movement: Change qty from purchase 20 to purchase 15 (decrease by 5)
    // The variant stock should become: 100 - 20 (reverse old) + 15 (apply new) = 95
    $response = $this->actingAs($user)
        ->put("/dashboard/ecommerce/stock-movements/{$movement->id}", [
            'product_variant_id' => $variant->id,
            'type' => 'purchase',
            'qty' => 15,
            'note' => 'Updated purchase note',
        ]);

    $response->assertRedirect('/dashboard/ecommerce/stock-movements');
    $this->assertEquals(95, $variant->fresh()->stock);
    $this->assertDatabaseHas('stock_movements', [
        'id' => $movement->id,
        'qty' => 15,
        'stock_before' => 80,
        'stock_after' => 95,
        'note' => 'Updated purchase note',
    ]);
});

test('user can delete stock movement and reverse variant stock levels', function () {
    $user = User::factory()->create();
    $variant = createBaseProductAndVariant();

    // Setup variant stock = 100 after a sale of 10
    $variant->update(['stock' => 100]);

    $movement = StockMovement::create([
        'product_variant_id' => $variant->id,
        'type' => 'sale',
        'qty' => 10, // decreased variant stock by 10
        'stock_before' => 110,
        'stock_after' => 100,
        'note' => 'Store sale',
    ]);

    // Deleting the sale of 10 should restore the stock to 110
    $response = $this->actingAs($user)
        ->delete("/dashboard/ecommerce/stock-movements/{$movement->id}");

    $response->assertRedirect('/dashboard/ecommerce/stock-movements');
    $this->assertEquals(110, $variant->fresh()->stock);
    $this->assertDatabaseMissing('stock_movements', ['id' => $movement->id]);
});
