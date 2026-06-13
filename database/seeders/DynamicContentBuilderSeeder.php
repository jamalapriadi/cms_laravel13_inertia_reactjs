<?php

namespace Database\Seeders;

use App\Models\ContentType;
use App\Models\CustomField;
use App\Models\CustomFieldGroup;
use Illuminate\Database\Seeder;

class DynamicContentBuilderSeeder extends Seeder
{
    public function run(): void
    {
        $contentType = ContentType::query()->updateOrCreate(
            ['slug' => 'testimonials'],
            [
                'name' => 'Testimonials',
                'description' => 'Data testimoni customer',
                'icon' => 'message-square-quote',
                'is_active' => true,
                'sort_order' => 10,
            ]
        );

        $fieldGroup = CustomFieldGroup::query()->updateOrCreate(
            [
                'target_type' => 'content_type',
                'target_id' => $contentType->id,
                'slug' => 'testimonial-fields',
            ],
            [
                'name' => 'Testimonial Fields',
                'description' => 'Field utama untuk content testimonial.',
                'is_active' => true,
                'sort_order' => 10,
            ]
        );

        $fields = [
            [
                'label' => 'Customer Name',
                'name' => 'customer_name',
                'type' => 'text',
                'is_required' => true,
                'sort_order' => 10,
            ],
            [
                'label' => 'Customer Photo',
                'name' => 'customer_photo',
                'type' => 'image',
                'sort_order' => 20,
            ],
            [
                'label' => 'Position',
                'name' => 'position',
                'type' => 'text',
                'sort_order' => 30,
            ],
            [
                'label' => 'Company',
                'name' => 'company',
                'type' => 'text',
                'sort_order' => 40,
            ],
            [
                'label' => 'Rating',
                'name' => 'rating',
                'type' => 'number',
                'sort_order' => 50,
            ],
            [
                'label' => 'Testimonial Text',
                'name' => 'testimonial_text',
                'type' => 'textarea',
                'is_required' => true,
                'sort_order' => 60,
            ],
            [
                'label' => 'Is Featured',
                'name' => 'is_featured',
                'type' => 'true_false',
                'default_value' => false,
                'sort_order' => 70,
            ],
        ];

        foreach ($fields as $field) {
            CustomField::query()->updateOrCreate(
                [
                    'custom_field_group_id' => $fieldGroup->id,
                    'name' => $field['name'],
                ],
                [
                    'label' => $field['label'],
                    'type' => $field['type'],
                    'placeholder' => $field['placeholder'] ?? null,
                    'instructions' => $field['instructions'] ?? null,
                    'options' => $field['options'] ?? null,
                    'default_value' => $field['default_value'] ?? null,
                    'validation_rules' => $field['validation_rules'] ?? null,
                    'is_required' => $field['is_required'] ?? false,
                    'is_active' => true,
                    'sort_order' => $field['sort_order'],
                ]
            );
        }
    }
}
