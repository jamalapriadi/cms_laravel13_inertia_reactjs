<?php

namespace App\Http\Requests\Dashboard\Theme;

use App\Models\Theme;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ThemeSettingsUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'settings' => ['required', 'array'],
        ];

        foreach ($this->settingDefinitions() as $key => $definition) {
            $field = "settings.{$key}";
            $type = $definition['type'] ?? 'text';
            $fieldRules = ['nullable'];

            if ($type === 'boolean') {
                $fieldRules[] = 'boolean';
            } elseif ($type === 'number') {
                $fieldRules[] = 'numeric';
            } else {
                $fieldRules[] = 'string';
            }

            if ($type === 'select' && is_array($definition['options'] ?? null)) {
                $fieldRules[] = Rule::in(array_values($definition['options']));
            }

            $rules[$field] = $fieldRules;
        }

        return $rules;
    }

    protected function prepareForValidation(): void
    {
        $settings = $this->input('settings', []);

        if (! is_array($settings)) {
            $settings = [];
        }

        foreach ($this->settingDefinitions() as $key => $definition) {
            if (! array_key_exists($key, $settings)) {
                continue;
            }

            $type = $definition['type'] ?? 'text';
            $value = $settings[$key];

            if ($type === 'boolean') {
                $settings[$key] = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                continue;
            }

            if ($type === 'number' && $value !== null && $value !== '') {
                $settings[$key] = is_numeric($value) ? $value + 0 : $value;
                continue;
            }

            if (is_string($value)) {
                $settings[$key] = trim($value);
            }
        }

        $this->merge([
            'settings' => $settings,
        ]);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function settingDefinitions(): array
    {
        $theme = $this->route('theme');

        if (! $theme instanceof Theme) {
            return [];
        }

        $settings = $theme->manifest['settings'] ?? [];

        return is_array($settings) ? $settings : [];
    }
}
