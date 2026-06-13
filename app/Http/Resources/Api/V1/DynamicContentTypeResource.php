<?php

namespace App\Http\Resources\Api\V1;

use App\Models\CustomField;
use App\Models\CustomFieldGroup;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ContentType */
class DynamicContentTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'sort_order' => $this->sort_order,
            'field_groups' => $this->whenLoaded('fieldGroups', fn () => $this->fieldGroups
                ->map(fn (CustomFieldGroup $group) => [
                    'id' => $group->id,
                    'name' => $group->name,
                    'slug' => $group->slug,
                    'description' => $group->description,
                    'sort_order' => $group->sort_order,
                    'fields' => $group->fields
                        ->map(fn (CustomField $field) => [
                            'id' => $field->id,
                            'label' => $field->label,
                            'name' => $field->name,
                            'type' => $field->type,
                            'placeholder' => $field->placeholder,
                            'instructions' => $field->instructions,
                            'options' => $field->options ?? [],
                            'default_value' => $field->default_value,
                            'is_required' => (bool) $field->is_required,
                            'sort_order' => $field->sort_order,
                        ])
                        ->values()
                        ->all(),
                ])
                ->values()
                ->all(), []),
        ];
    }
}
