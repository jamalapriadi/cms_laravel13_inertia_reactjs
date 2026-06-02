<?php

namespace App\Http\Requests\Store\BannerSlide;

use Illuminate\Foundation\Http\FormRequest;

class BannerSlideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isCreate = $this->isMethod('post');

        return [
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image' => $this->hasFile('image')
                ? ['image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:2048']
                : [$isCreate ? 'required' : 'nullable', 'string'],
            'mobile_image' => $this->hasFile('mobile_image')
                ? ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:2048']
                : ['nullable', 'string'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_url' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:100'],
            'position' => ['required', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'title' => $this->input('title') ?: null,
            'subtitle' => $this->input('subtitle') ?: null,
            'description' => $this->input('description') ?: null,
            'button_text' => $this->input('button_text') ?: null,
            'button_url' => $this->input('button_url') ?: null,
            'is_active' => filter_var($this->input('is_active', true), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
            'sort_order' => $this->input('sort_order') !== null ? (int) $this->input('sort_order') : 0,
            'start_at' => $this->input('start_at') ?: null,
            'end_at' => $this->input('end_at') ?: null,
            'image' => $this->input('image') ?: null,
            'mobile_image' => $this->input('mobile_image') ?: null,
        ]);
    }
}
