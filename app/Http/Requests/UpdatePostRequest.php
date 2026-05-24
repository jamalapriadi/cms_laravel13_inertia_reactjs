<?php

namespace App\Http\Requests;

use App\Rules\ValidPostBlocks;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePostRequest extends FormRequest
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
            'title' => 'required|string|max:255',
            'blocks' => ['nullable', 'json', new ValidPostBlocks],
            'status' => ['required', 'string', Rule::in(['draft', 'publish'])],
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
