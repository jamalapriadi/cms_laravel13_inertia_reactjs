<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            // 'content' => 'nullable|json',
            'content' => [
                'nullable',
                'json',
                function ($attr, $value, $fail) {
                    $blocks = json_decode($value, true);

                    if (!is_array($blocks)) {
                        return $fail('Invalid block format');
                    }

                    foreach ($blocks as $block) {
                        if (!isset($block['type'])) {
                            return $fail('Block type missing');
                        }
                    }
                }
            ],
            'status' => 'required|string',
            // 'categories' => 'array',
            // 'tags' => 'array',
            'featured_image' => 'nullable|string',
        ];
    }
}
