<?php

namespace App\Http\Requests;

use App\Rules\ValidPostBlocks;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AutoSavePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->filled('slug')) {
            $this->merge([
                'slug' => Str::slug($this->slug),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'nullable|string|max:255',
            'slug' => ['nullable', 'string', 'max:255'],
            'excerpt' => 'nullable|string',
            'content' => ['nullable', 'json', new ValidPostBlocks],
            'blocks' => ['nullable', 'json', new ValidPostBlocks],
            'category_id' => ['nullable', 'uuid', 'exists:post_categories,id'],
            'tags' => ['nullable', 'array'],
            'tags.*' => [
                'integer',
                Rule::exists('term_taxonomy', 'id')->where('taxonomy', 'tags'),
            ],
            'tag_names' => ['nullable', 'array'],
            'tag_names.*' => ['string', 'max:191'],
            'featured_image' => 'nullable|string',
            'published_at' => ['nullable', 'date'],
        ];
    }
}
