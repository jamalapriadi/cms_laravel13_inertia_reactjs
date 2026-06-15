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

function grantDynamicBuilderPermissions(User $user, array $permissions): User
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
 * @return array<string, string>
 */
test('authorized user can manage the dynamic content builder from dashboard', function () {
    $user = grantDynamicBuilderPermissions(User::factory()->create(), [
        'content-types.view',
        'content-types.create',
        'content-types.edit',
        'content-types.delete',
        'custom-fields.view',
        'custom-fields.create',
        'custom-fields.edit',
        'dynamic-contents.view',
        'dynamic-contents.create',
        'dynamic-contents.edit',
        'dynamic-contents.delete',
    ]);

    $this->actingAs($user)
        ->post(route('content-types.store'), [
            'name' => 'Testimonials',
            'slug' => 'Testimonials',
            'description' => 'Customer testimonials',
            'icon' => 'message-square-quote',
            'is_active' => true,
            'sort_order' => 1,
        ])
        ->assertRedirect(route('content-types.index'))
        ->assertSessionHasNoErrors();

    $contentType = ContentType::query()->firstOrFail();

    expect($contentType->slug)->toBe('testimonials');

    $this->actingAs($user)
        ->get(route('content-types.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/ContentTypes/Index')
            ->where('contentTypes.data.0.slug', 'testimonials')
            ->where('dynamicContentTypes.0.slug', 'testimonials')
        );

    $this->actingAs($user)
        ->post(route('custom-fields.store'), [
            'name' => 'Testimonial Fields',
            'slug' => 'testimonial-fields',
            'description' => 'Fields used by testimonial entries',
            'content_type_id' => $contentType->id,
            'is_active' => true,
            'sort_order' => 1,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $fieldGroup = CustomFieldGroup::query()->firstOrFail();

    collect([
        [
            'label' => 'Customer Name',
            'name' => 'customer_name',
            'type' => 'text',
            'placeholder' => 'Budi Santoso',
            'is_required' => true,
            'sort_order' => 1,
        ],
        [
            'label' => 'Customer Photo',
            'name' => 'customer_photo',
            'type' => 'image',
            'sort_order' => 2,
        ],
        [
            'label' => 'Rating',
            'name' => 'rating',
            'type' => 'number',
            'validation_rules' => ['min:1', 'max:5'],
            'sort_order' => 3,
        ],
        [
            'label' => 'Is Featured',
            'name' => 'is_featured',
            'type' => 'true_false',
            'default_value' => true,
            'sort_order' => 4,
        ],
        [
            'label' => 'Metadata',
            'name' => 'metadata',
            'type' => 'json',
            'default_value' => '{"source":"dashboard"}',
            'sort_order' => 5,
        ],
    ])->each(function (array $payload) use ($user, $fieldGroup): void {
        $this->actingAs($user)
            ->post(route('custom-fields.fields.store', $fieldGroup), $payload)
            ->assertRedirect(route('custom-fields.edit', $fieldGroup))
            ->assertSessionHasNoErrors();
    });

    $fieldGroup->refresh()->load(['fields' => fn ($query) => $query->orderBy('sort_order')]);

    expect($fieldGroup->fields)->toHaveCount(5);

    $this->actingAs($user)
        ->get(route('custom-fields.edit', $fieldGroup))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/CustomFields/Edit')
            ->where('customFieldGroup.slug', 'testimonial-fields')
            ->where('customFieldGroup.fields.0.name', 'customer_name')
            ->where('customFieldGroup.fields.4.name', 'metadata')
        );

    $this->actingAs($user)
        ->post(route('dynamic-content.store', ['contentType' => $contentType->slug]), [
            'title' => 'Testimoni dari Budi',
            'slug' => 'testimoni-dari-budi',
            'excerpt' => 'Pelanggan setia',
            'status' => 'published',
            'published_at' => '2026-06-13T10:00',
            'sort_order' => 1,
            'fields' => [
                'customer_name' => 'Budi Santoso',
                'customer_photo' => '/storage/media/testimonials/budi.webp',
                'rating' => '5',
                'is_featured' => '1',
                'metadata' => '{"source":"manual"}',
            ],
        ])
        ->assertRedirect(route('dynamic-content.index', ['contentType' => $contentType->slug]))
        ->assertSessionHasNoErrors();

    $entry = ContentEntry::query()->firstOrFail();

    expect($entry->slug)->toBe('testimoni-dari-budi')
        ->and($entry->status)->toBe('published')
        ->and($entry->published_at)->not->toBeNull()
        ->and($entry->data['customer_name'])->toBe('Budi Santoso')
        ->and($entry->data['customer_photo'])->toBe('media/testimonials/budi.webp')
        ->and($entry->data['rating'])->toBe(5)
        ->and($entry->data['is_featured'])->toBeTrue()
        ->and($entry->data['metadata'])->toBe(['source' => 'manual']);

    $this->actingAs($user)
        ->get(route('dynamic-content.edit', [
            'contentType' => $contentType->slug,
            'contentEntry' => $entry->id,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/DynamicContent/Edit')
            ->where('contentType.slug', 'testimonials')
            ->where('contentEntry.slug', 'testimoni-dari-budi')
            ->where('form.fields.customer_name', 'Budi Santoso')
        );

    $this->actingAs($user)
        ->put(route('dynamic-content.update', [
            'contentType' => $contentType->slug,
            'contentEntry' => $entry->id,
        ]), [
            'title' => 'Testimoni Premium Budi',
            'slug' => 'testimoni-premium-budi',
            'excerpt' => '',
            'status' => 'draft',
            'published_at' => '',
            'sort_order' => 3,
            'fields' => [
                'customer_name' => 'Budi Premium',
                'customer_photo' => 'storage/media/testimonials/budi-premium.webp',
                'rating' => '4',
                'is_featured' => '0',
                'metadata' => '{"source":"updated"}',
            ],
        ])
        ->assertRedirect(route('dynamic-content.index', ['contentType' => $contentType->slug]))
        ->assertSessionHasNoErrors();

    $entry->refresh();

    expect($entry->slug)->toBe('testimoni-premium-budi')
        ->and($entry->excerpt)->toBeNull()
        ->and($entry->status)->toBe('draft')
        ->and($entry->published_at)->toBeNull()
        ->and($entry->sort_order)->toBe(3)
        ->and($entry->data['customer_name'])->toBe('Budi Premium')
        ->and($entry->data['customer_photo'])->toBe('media/testimonials/budi-premium.webp')
        ->and($entry->data['rating'])->toBe(4)
        ->and($entry->data['is_featured'])->toBeFalse()
        ->and($entry->data['metadata'])->toBe(['source' => 'updated']);

    $this->actingAs($user)
        ->delete(route('content-types.destroy', $contentType))
        ->assertRedirect(route('content-types.index'));

    $fieldIds = $fieldGroup->fields->pluck('id')->all();

    $this->assertSoftDeleted('content_types', ['id' => $contentType->id]);
    $this->assertSoftDeleted('custom_field_groups', ['id' => $fieldGroup->id]);
    $this->assertSoftDeleted('content_entries', ['id' => $entry->id]);

    foreach ($fieldIds as $fieldId) {
        $this->assertSoftDeleted('custom_fields', ['id' => $fieldId]);
    }
});

test('content type list cache is refreshed after creating a new content type', function () {
    $user = grantDynamicBuilderPermissions(User::factory()->create(), [
        'content-types.view',
        'content-types.create',
    ]);

    $this->withoutVite();

    $this->actingAs($user)
        ->get(route('content-types.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/ContentTypes/Index')
            ->where('contentTypes.data', [])
        );

    $this->actingAs($user)
        ->post(route('content-types.store'), [
            'name' => 'Testimonials',
            'slug' => 'testimonials',
            'is_active' => true,
            'sort_order' => 1,
        ])
        ->assertRedirect(route('content-types.index'));

    $this->actingAs($user)
        ->get(route('content-types.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/ContentTypes/Index')
            ->where('contentTypes.data.0.slug', 'testimonials')
        );
});

test('dashboard dynamic content routes require the mapped permissions', function () {
    $user = User::factory()->create();

    $contentType = ContentType::query()->create([
        'name' => 'Testimonials',
        'slug' => 'testimonials',
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->get(route('content-types.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('dynamic-content.index', ['contentType' => $contentType->slug]))
        ->assertForbidden();
});
