<?php

namespace App\Http\Requests\Store\Category;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryUpdateRequest extends FormRequest
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
            'slug' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($this->route('category')?->id)],
            'parent_id' => ['nullable', 'uuid', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'image' => $this->hasFile('image')
                ? ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:2048']
                : ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'show_home' => ['nullable', 'boolean'],
            'is_publish' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        $this->merge([
            'show_home' => filter_var($this->show_home, FILTER_VALIDATE_BOOLEAN),
            'is_publish' => filter_var($this->is_publish, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
        ]);
        if ($this->filled('slug')) {
            $this->merge([
                'slug' => Str::slug($this->slug),
            ]);
        }
    }
}
