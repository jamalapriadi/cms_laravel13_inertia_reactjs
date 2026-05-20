<?php

namespace App\Http\Requests\Store\Unit;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UnitRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:50', 'unique:units,code'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Unit name is required',
            'name.string' => 'Unit name must be a string',
            'name.max' => 'Unit name must not exceed 255 characters',
            'code.required' => 'Unit code is required',
            'code.string' => 'Unit code must be a string',
            'code.max' => 'Unit code must not exceed 50 characters',
            'code.unique' => 'Unit code has already been taken',
        ];
    }
}
