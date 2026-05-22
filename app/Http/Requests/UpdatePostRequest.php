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
            // 'categories' => 'array',
            // 'tags' => 'array',
            'featured_image' => 'nullable|string',
        ];
    }
}
