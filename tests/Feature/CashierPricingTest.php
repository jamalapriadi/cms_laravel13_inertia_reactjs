<?php

use App\Models\Shop\CashierSession;
use App\Models\Shop\Category;
use App\Models\Shop\OrderDiscountApproval;
use App\Models\Shop\Product;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

beforeEach(function () {
    // Setup Super Admin role and permissions
    $superAdminRole = Role::firstOrCreate(['name' => 'super-admin']);

    // Create base permissions
    Permission::firstOrCreate(['name' => 'cashier.access']);
    Permission::firstOrCreate(['name' => 'cashier.access']);
    Permission::firstOrCreate(['name' => 'cashier.discount.apply']);
    Permission::firstOrCreate(['name' => 'cashier.price_override']);
    Permission::firstOrCreate(['name' => 'cashier.discount.approve']);
    Permission::firstOrCreate(['name' => 'cashier.discount.view_approvals']);

    // Setup Cashier user
    $this->cashier = User::factory()->create();
    $this->cashier->givePermissionTo([
        'cashier.access',
        'cashier.discount.apply',
        'cashier.price_override',
        'cashier.discount.view_approvals',
    ]);

    // Setup Admin user
    $this->admin = User::factory()->create();
    $this->admin->assignRole($superAdminRole);
    $this->admin->givePermissionTo([
        'cashier.access',
        'cashier.discount.approve',
        'cashier.discount.view_approvals',
    ]);

    // Create session
    $this->session = CashierSession::create([
        'cashier_id' => $this->cashier->id,
        'status' => 'open',
        'opened_at' => now(),
        'opening_cash' => 100000,
    ]);

    // Create category
    $category = Category::create([
        'name' => 'Test Category',
        'slug' => 'test-category',
        'is_active' => true,
    ]);

    // Create products
    $this->product = Product::create([
        'category_id' => $category->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'sku' => 'TEST-001',
        'base_price' => 100000,
        'status' => 'active',
        'is_publish' => true,
    ]);
});

it('can preview pricing without approval if within limits', function () {
    config(['cashier.discount.max_without_approval_amount' => 15000]);
    config(['cashier.discount.max_without_approval_percentage' => 100]);

    actingAs($this->cashier);

    $response = postJson('/my-admin/dashboard/cashier/pricing/preview', [
        'items' => [
            [
                'product_id' => $this->product->id,
                'qty' => 1,
                'final_unit_price' => 100000,
                'is_price_overridden' => false,
            ],
        ],
        'discount_type' => 'nominal',
        'discount_value' => 10000, // Within 15k limit
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'subtotal' => 100000,
                'discount_amount' => 10000,
                'grand_total' => 90000,
                'requires_approval' => false,
            ],
        ]);
});

it('requires approval if discount exceeds limit', function () {
    config(['cashier.discount.max_without_approval_percentage' => 5]);
    config(['cashier.discount.max_without_approval_amount' => 15000]);

    actingAs($this->cashier);

    $response = postJson('/my-admin/dashboard/cashier/pricing/preview', [
        'items' => [
            [
                'product_id' => $this->product->id,
                'qty' => 1,
                'final_unit_price' => 100000,
                'is_price_overridden' => false,
            ],
        ],
        'discount_type' => 'nominal',
        'discount_value' => 20000, // Exceeds 15k limit
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'requires_approval' => true,
            ],
        ]);
});

it('prevents price override without permission', function () {
    // Remove permission from cashier
    $this->cashier->revokePermissionTo('cashier.price_override');

    actingAs($this->cashier);

    $response = postJson('/my-admin/dashboard/cashier/pricing/preview', [
        'items' => [
            [
                'product_id' => $this->product->id,
                'qty' => 1,
                'final_unit_price' => 80000, // 20% down, exceeds 10% limit
                'is_price_overridden' => true,
                'price_override_reason' => 'Nego keras',
            ],
        ],
        'discount_type' => 'nominal',
        'discount_value' => 0,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['items']);
});

it('allows cashier to create discount approval request', function () {
    actingAs($this->cashier);

    $response = postJson('/my-admin/dashboard/cashier/discount-approvals', [
        'cashier_session_id' => $this->session->id,
        'approval_type' => 'order_discount',
        'discount_type' => 'nominal',
        'discount_value' => 50000,
        'discount_amount' => 50000,
        'discount_percentage' => 0,
        'subtotal_before_discount' => 100000,
        'grand_total_after_discount' => 50000,
        'reason' => 'Pelanggan loyal',
        'items_snapshot' => [
            [
                'product_id' => $this->product->id,
                'qty' => 1,
                'unit_price' => 100000,
            ],
        ],
        'pricing_snapshot' => [
            'subtotal' => 100000,
            'discount' => 50000,
        ],
        'request_note' => 'Pelanggan loyal belanja banyak',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('order_discount_approvals', [
        'cashier_id' => $this->cashier->id,
        'approval_type' => 'order_discount',
        'status' => 'pending',
    ]);
});

it('allows admin to approve discount request', function () {
    $approval = OrderDiscountApproval::create([
        'cashier_id' => $this->cashier->id,
        'cashier_session_id' => $this->session->id,
        'approval_type' => 'order_discount',
        'discount_type' => 'nominal',
        'discount_value' => 50000,
        'discount_amount' => 50000,
        'discount_percentage' => 0,
        'subtotal_before_discount' => 100000,
        'grand_total_after_discount' => 50000,
        'reason' => 'Test reason',
        'status' => 'pending',
        'items_snapshot' => [],
        'pricing_snapshot' => [],
    ]);

    actingAs($this->admin);

    $response = postJson("/my-admin/dashboard/cashier/discount-approvals/{$approval->id}/approve", [
        'note' => 'Approved by admin',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('order_discount_approvals', [
        'id' => $approval->id,
        'status' => 'approved',
        'approved_by' => $this->admin->id,
        'approval_note' => 'Approved by admin',
    ]);
});
