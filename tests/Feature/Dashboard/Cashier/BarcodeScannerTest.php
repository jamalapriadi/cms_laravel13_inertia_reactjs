<?php

use App\Models\Shop\CashierSession;
use App\Models\Shop\Category;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\VariantItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $cashierRole = Role::firstOrCreate(['name' => 'cashier']);
    $dashboardPermission = Permission::firstOrCreate(['name' => 'dashboard.view']);
    $ordersViewPermission = Permission::firstOrCreate(['name' => 'orders.view']);
    $ordersCreatePermission = Permission::firstOrCreate(['name' => 'orders.create']);
    $cashierRole->givePermissionTo([$dashboardPermission, $ordersViewPermission, $ordersCreatePermission]);

    $this->cashier = User::factory()->create();
    $this->cashier->assignRole('cashier');

    // Create an open session
    $this->session = CashierSession::create([
        'cashier_id' => $this->cashier->id,
        'status' => 'open',
        'opened_at' => now(),
        'starting_cash' => 500000,
    ]);

    $this->category = Category::create([
        'name' => 'Test Category',
        'slug' => 'test-category-'.Str::random(5),
    ]);

    $this->withoutVite();
});

it('can scan a product by SKU', function () {
    $product = Product::create([
        'name' => 'Test Product',
        'sku' => 'SKU-PROD-001',
        'has_variants' => false,
        'base_price' => 10000,
        'slug' => Str::random(10),
        'category_id' => $this->category->id,
    ]);
    ProductStockUnit::create([
        'product_id' => $product->id,
        'status' => 'available',
        'imei_serial_number' => Str::random(10),
    ]);

    $response = $this->actingAs($this->cashier)
        ->get(route('dashboard.cashier.barcode.scan', ['code' => 'SKU-PROD-001']));

    $response->assertStatus(200)
        ->assertJsonPath('data.product_id', $product->id)
        ->assertJsonPath('data.type', 'simple_product');
});

it('can scan a variant item by SKU', function () {
    $product = Product::create([
        'name' => 'Test Variant Product',
        'has_variants' => true,
        'base_price' => 10000,
        'slug' => Str::random(10),
        'category_id' => $this->category->id,
    ]);
    $variant = VariantItem::create([
        'product_id' => $product->id,
        'name' => 'Variant A',
        'sku' => 'SKU-VAR-001',
        'selling_price' => 12000,
    ]);
    ProductStockUnit::create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'status' => 'available',
        'imei_serial_number' => Str::random(10),
    ]);

    $response = $this->actingAs($this->cashier)
        ->get(route('dashboard.cashier.barcode.scan', ['code' => 'SKU-VAR-001']));

    $response->assertStatus(200)
        ->assertJsonPath('data.variant_item_id', $variant->id)
        ->assertJsonPath('data.type', 'variant_item');
});

it('can scan a stock unit by IMEI', function () {
    $product = Product::create([
        'name' => 'Test Stock Product',
        'has_variants' => false,
        'base_price' => 10000,
        'slug' => Str::random(10),
        'category_id' => $this->category->id,
    ]);
    $stockUnit = ProductStockUnit::create([
        'product_id' => $product->id,
        'status' => 'available',
        'imei_serial_number' => 'IMEI123456789',
    ]);

    $response = $this->actingAs($this->cashier)
        ->get(route('dashboard.cashier.barcode.scan', ['code' => 'IMEI123456789']));

    $response->assertStatus(200)
        ->assertJsonPath('data.stock_unit_id', $stockUnit->id)
        ->assertJsonPath('data.type', 'stock_unit');
});

it('returns 404 for not found barcode', function () {
    $response = $this->actingAs($this->cashier)
        ->get(route('dashboard.cashier.barcode.scan', ['code' => 'UNKNOWN']));

    $response->assertStatus(404);
});

it('returns 400 for out of stock product scan', function () {
    $product = Product::create([
        'name' => 'No Stock Product',
        'sku' => 'SKU-NOSTOCK',
        'has_variants' => false,
        'base_price' => 10000,
        'slug' => Str::random(10),
        'category_id' => $this->category->id,
    ]);

    $response = $this->actingAs($this->cashier)
        ->get(route('dashboard.cashier.barcode.scan', ['code' => 'SKU-NOSTOCK']));

    $response->assertStatus(400)
        ->assertJsonPath('message', 'Produk ditemukan, tetapi stok tidak tersedia.');
});

it('validates stock when storing an order via POS', function () {
    $product = Product::create([
        'name' => 'Buy Me',
        'has_variants' => false,
        'base_price' => 10000,
        'slug' => Str::random(10),
        'category_id' => $this->category->id,
    ]);
    $stockUnit = ProductStockUnit::create([
        'product_id' => $product->id,
        'status' => 'available',
        'imei_serial_number' => 'IMEI-TEST',
    ]);

    $response = $this->actingAs($this->cashier)->post(route('dashboard.cashier.orders.store'), [
        'items' => [
            [
                'product_id' => $product->id,
                'variant_item_id' => null,
                'stock_unit_id' => $stockUnit->id,
                'qty' => 1,
            ],
        ],
        'payment_method' => 'cash',
        'amount_paid' => 10000,
        'change_amount' => 0,
        'discount' => 0,
        'customer_name' => 'John',
        'customer_phone' => '08123',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('product_stock_units', [
        'id' => $stockUnit->id,
        'status' => 'sold',
    ]);
});

it('fails if specific stock unit is requested with qty > 1', function () {
    $product = Product::create([
        'name' => 'Double Buy Me',
        'has_variants' => false,
        'base_price' => 10000,
        'slug' => Str::random(10),
        'category_id' => $this->category->id,
    ]);
    $stockUnit = ProductStockUnit::create([
        'product_id' => $product->id,
        'status' => 'available',
        'imei_serial_number' => 'IMEI-TEST2',
    ]);

    $response = $this->actingAs($this->cashier)->post(route('dashboard.cashier.orders.store'), [
        'items' => [
            [
                'product_id' => $product->id,
                'variant_item_id' => null,
                'stock_unit_id' => $stockUnit->id,
                'qty' => 2,
            ],
        ],
        'payment_method' => 'cash',
        'amount_paid' => 20000,
        'change_amount' => 0,
        'discount' => 0,
        'customer_name' => 'John',
        'customer_phone' => '08123',
    ]);

    $response->assertSessionHasErrors(['error']);
});
