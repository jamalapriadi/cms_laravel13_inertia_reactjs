<?php

use App\Models\ContentEntry;
use App\Models\ContentType;
use App\Models\CustomFieldGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

function grantRelationTestPermissions(User $user, array $permissions): User
{
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);

    app(PermissionRegistrar::class)->forgetCachedPermissions();

    return $user->refresh();
}

test('user can create a custom field of type relation and fetch entry options', function () {
    $user = grantRelationTestPermissions(User::factory()->create(), [
        'content-types.view',
        'content-types.create',
        'content-types.edit',
        'custom-fields.view',
        'custom-fields.create',
        'custom-fields.edit',
        'dynamic-contents.view',
        'dynamic-contents.create',
        'dynamic-contents.edit',
    ]);

    // 1. Create a source content type "Province"
    $provinceType = ContentType::create([
        'name' => 'Province',
        'slug' => 'province',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    // Create custom field group for Province
    $provinceGroup = CustomFieldGroup::create([
        'target_type' => 'content_type',
        'target_id' => $provinceType->id,
        'name' => 'Province Fields',
        'slug' => 'province-fields',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    // 2. Create a target content type "Location"
    $locationType = ContentType::create([
        'name' => 'Location',
        'slug' => 'location',
        'is_active' => true,
        'sort_order' => 2,
    ]);

    $locationGroup = CustomFieldGroup::create([
        'target_type' => 'content_type',
        'target_id' => $locationType->id,
        'name' => 'Location Fields',
        'slug' => 'location-fields',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    // 3. Create a relation custom field on Location group pointing to Province
    $this->actingAs($user)
        ->post(route('custom-fields.fields.store', $locationGroup->id), [
            'label' => 'Province',
            'name' => 'province_id',
            'type' => 'relation',
            'options' => [
                'source_content_type_id' => $provinceType->id,
                'label_field' => 'title',
                'value_field' => 'id',
                'is_multiple' => false,
            ],
            'is_required' => true,
            'is_active' => true,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    // Verify it exists in database
    $field = $locationGroup->fields()->where('name', 'province_id')->first();
    expect($field)->not->toBeNull();
    expect($field->type)->toBe('relation');
    expect($field->options['source_content_type_id'])->toBe($provinceType->id);

    // 4. Create some entries for Province
    $provinceEntry1 = ContentEntry::create([
        'content_type_id' => $provinceType->id,
        'title' => 'Jawa Barat',
        'slug' => 'jawa-barat',
        'status' => 'published',
        'sort_order' => 1,
        'data' => [],
    ]);

    $provinceEntry2 = ContentEntry::create([
        'content_type_id' => $provinceType->id,
        'title' => 'Jawa Tengah',
        'slug' => 'jawa-tengah',
        'status' => 'published',
        'sort_order' => 2,
        'data' => [],
    ]);

    // 5. Test options endpoint
    $response = $this->actingAs($user)
        ->get(route('content-types.entries.options', $provinceType->id));

    $response->assertSuccessful();
    $data = $response->json();
    expect($data)->toHaveCount(2);
    expect($data[0]['label'])->toBe('Jawa Barat');
    expect($data[1]['label'])->toBe('Jawa Tengah');

    // 6. Test entry validation and saving
    // Try invalid reference
    $this->actingAs($user)
        ->post(route('dynamic-content.store', $locationType->slug), [
            'title' => 'Bandung Office',
            'slug' => 'bandung-office',
            'status' => 'published',
            'fields' => [
                'province_id' => '00000000-0000-0000-0000-000000000000',
            ],
        ])
        ->assertSessionHasErrors(['fields.province_id']);

    // Save valid reference
    $this->actingAs($user)
        ->post(route('dynamic-content.store', $locationType->slug), [
            'title' => 'Bandung Office',
            'slug' => 'bandung-office',
            'status' => 'published',
            'fields' => [
                'province_id' => $provinceEntry1->id,
            ],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    // Verify entry was saved
    $entry = ContentEntry::where('slug', 'bandung-office')->firstOrFail();
    expect($entry->data['province_id'])->toBe($provinceEntry1->id);

    // 7. Verify index page payload contains resolved relation label
    $this->actingAs($user)
        ->get(route('dynamic-content.index', $locationType->slug))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/DynamicContent/Index')
            ->where('entries.data.0.relation_labels.province_id', 'Jawa Barat')
        );
});
