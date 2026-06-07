<?php

namespace App\Http\Requests;

use App\Rules\ValidPostBlocks;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('pages', 'slug')],
            'excerpt' => ['nullable', 'string'],
            'content' => ['nullable', 'json', new ValidPostBlocks],
            'blocks' => ['nullable', 'json', new ValidPostBlocks],
            'status' => ['required', 'string', Rule::in(['draft', 'publish', 'archived'])],
            'featured_image' => ['nullable', 'string'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string'],
            'seo_keywords' => ['nullable', 'string'],
            'og_image' => ['nullable', 'string'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
