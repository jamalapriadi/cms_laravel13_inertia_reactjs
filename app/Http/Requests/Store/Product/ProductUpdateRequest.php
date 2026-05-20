<?php

namespace App\Http\Requests\Store\Product;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProductUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'uuid', 'exists:categories,id'],
            'brand_id' => ['nullable', 'uuid', 'exists:brands,id'],
            'thumbnail' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:2048'],
            'description' => ['nullable', 'string'],
            'condition' => ['required', 'in:new,like_new,second'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'has_variant' => ['nullable', 'boolean'],
            'requires_imei' => ['nullable', 'boolean'],
            'imei_serial_number' => ['nullable', 'string', 'max:255'],
            'network_compatibility' => ['nullable', 'string', 'in:sim_free,docomo,au,softbank,rakuten,mineo'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'is_publish' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        $this->merge([
            'has_variant' => filter_var($this->has_variant, FILTER_VALIDATE_BOOLEAN),
            'requires_imei' => filter_var($this->requires_imei, FILTER_VALIDATE_BOOLEAN),
            'is_publish' => filter_var($this->is_publish, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
        ]);
    }
}
