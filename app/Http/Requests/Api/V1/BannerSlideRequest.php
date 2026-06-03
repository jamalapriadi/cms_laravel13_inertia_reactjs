<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class BannerSlideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['nullable', 'string', 'max:100'],
            'position' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'string', 'max:100'],
            'placement' => ['nullable', 'string', 'max:150'],
            'lang' => ['nullable', 'string', 'max:35'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $type = $this->stringValue($this->query('type'));
        $position = $this->stringValue($this->query('position'));
        $page = $this->stringValue($this->query('page'));
        $placement = $this->stringValue($this->query('placement'));

        if (! $type && $page) {
            $type = $page;
        }

        if ($placement && str_contains($placement, '_')) {
            [$placementType, $placementPosition] = array_pad(explode('_', $placement, 2), 2, null);
            $type = $type ?: $placementType;
            $position = $position ?: $placementPosition;
        }

        $this->merge([
            'type' => $type,
            'position' => $position,
            'page' => $page,
            'placement' => $placement,
            'lang' => $this->stringValue($this->query('lang')),
        ]);
    }

    private function stringValue(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = strtolower(trim($value));

        return $value !== '' ? $value : null;
    }
}
