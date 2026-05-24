<?php

use App\Models\Shop\Category;
use App\Models\Shop\IncomingGoods;
use App\Models\Shop\Product;
use App\Models\Shop\ProductStockUnit;
use App\Models\Shop\ProductVariant;
use App\Models\Shop\StockMovement;
use App\Models\Shop\Supplier;
use App\Models\Shop\SupplierReturn;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createSupplierInventoryVariant(): ProductVariant
{
    $category = Category::create([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'is_publish' => true,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'condition' => 'new',
        'base_price' => 15000000,
        'is_publish' => true,
    ]);

    return ProductVariant::create([
        'product_id' => $product->id,
        'name' => '128GB Black',
        'sku' => 'IP15-128-BLK',
        'price' => 14500000,
        'cost_price' => 12000000,
        'stock' => 0,
        'track_stock' => true,
        'is_active' => true,
    ]);
}

function createInventorySupplier(): Supplier
{
    return Supplier::create([
        'name' => 'PT Sumber Makmur',
        'code' => 'SPL-SM',
        'phone' => '08123456789',
        'is_active' => true,
    ]);
}

test('authenticated user can create completed incoming goods and stock is synced', function () {
    $user = User::factory()->create();
    $supplier = createInventorySupplier();
    $variant = createSupplierInventoryVariant();

    $response = $this
        ->actingAs($user)
        ->post(route('incoming-goods.store'), [
            'supplier_id' => $supplier->id,
            'invoice_number' => 'INV-SPL-001',
            'transaction_date' => now()->toDateString(),
            'status' => 'completed',
            'items' => [
                [
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'qty' => 2,
                    'cost_price' => 12000000,
                    'stock_units' => [
                        [
                            'imei_serial_number' => '351234567890123',
                            'network_compatibility' => 'sim_free',
                        ],
                        [
                            'imei_serial_number' => '990000862471854',
                            'network_compatibility' => 'docomo',
                        ],
                    ],
                ],
            ],
        ]);

    $response->assertRedirect(route('incoming-goods.index'));

    $incomingGoods = IncomingGoods::where('invoice_number', 'INV-SPL-001')->first();

    expect($incomingGoods)->not->toBeNull()
        ->and($incomingGoods->total_amount)->toEqual('24000000.00')
        ->and($variant->refresh()->stock)->toBe(2);

    $this->assertDatabaseHas('product_stock_units', [
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '351234567890123',
        'status' => 'available',
    ]);

    expect(StockMovement::where('type', 'purchase')->count())->toBe(2);
});

test('incoming goods validates stock unit count against item quantity', function () {
    $user = User::factory()->create();
    $supplier = createInventorySupplier();
    $variant = createSupplierInventoryVariant();

    $response = $this
        ->actingAs($user)
        ->from(route('incoming-goods.create'))
        ->post(route('incoming-goods.store'), [
            'supplier_id' => $supplier->id,
            'invoice_number' => 'INV-SPL-002',
            'transaction_date' => now()->toDateString(),
            'status' => 'pending',
            'items' => [
                [
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'qty' => 2,
                    'cost_price' => 12000000,
                    'stock_units' => [
                        [
                            'imei_serial_number' => '351234567890124',
                            'network_compatibility' => 'sim_free',
                        ],
                    ],
                ],
            ],
        ]);

    $response->assertSessionHasErrors('items.0.stock_units');
});

test('authenticated user can return damaged goods to supplier and stock is synced', function () {
    $user = User::factory()->create();
    $supplier = createInventorySupplier();
    $variant = createSupplierInventoryVariant();

    $stockUnit = ProductStockUnit::create([
        'product_variant_id' => $variant->id,
        'imei_serial_number' => '351234567890123',
        'network_compatibility' => 'sim_free',
        'status' => 'available',
    ]);

    $variant->syncStockFromUnits();

    $response = $this
        ->actingAs($user)
        ->post(route('supplier-returns.store'), [
            'supplier_id' => $supplier->id,
            'return_number' => 'RTR-SPL-001',
            'return_date' => now()->toDateString(),
            'status' => 'completed',
            'items' => [
                [
                    'product_stock_unit_id' => $stockUnit->id,
                    'notes' => 'LCD rusak',
                ],
            ],
        ]);

    $response->assertRedirect(route('supplier-returns.index'));

    $supplierReturn = SupplierReturn::where('return_number', 'RTR-SPL-001')->first();

    expect($supplierReturn)->not->toBeNull()
        ->and($stockUnit->refresh()->status)->toBe('damaged')
        ->and($variant->refresh()->stock)->toBe(0);

    $this->assertDatabaseHas('stock_movements', [
        'product_variant_id' => $variant->id,
        'product_stock_unit_id' => $stockUnit->id,
        'type' => 'adjustment',
        'qty' => -1,
        'stock_unit_status_after' => 'damaged',
    ]);
});
