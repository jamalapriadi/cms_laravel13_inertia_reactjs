<?php

namespace App\Http\Requests\Dashboard\DynamicContent;

use App\Models\Dashboard\Language;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContentTranslationRequest extends FormRequest
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
        $language = $this->route('language');
        $languageId = $language instanceof Language ? $language->id : $language;
        $contentEntry = $this->route('contentEntry');
        $contentEntryId = is_object($contentEntry) ? $contentEntry->id : $contentEntry;

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('content_entry_translations', 'slug')
                    ->where('language_id', $languageId)
                    ->ignore($contentEntryId, 'content_entry_id'),
            ],
            'excerpt' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:draft,published,archived'],
            'published_at' => ['nullable', 'date'],
            'data' => ['nullable', 'array'],
        ];
    }
}
