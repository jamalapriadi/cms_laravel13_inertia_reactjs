<?php

namespace App\Http\Requests\Dashboard\Cms;

use App\Models\Page;
use App\Models\PageTranslation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePageTranslationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Page $page */
        $page = $this->route('page');
        $language = $this->route('language');
        $languageId = is_object($language) ? $language->id : (int) $language;
        $existingTranslationId = PageTranslation::query()
            ->where('page_id', $page->id)
            ->where('language_id', $languageId)
            ->value('id');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('page_translations', 'slug')
                    ->ignore($existingTranslationId)
                    ->where(fn ($query) => $query->where('language_id', $languageId)),
            ],
            'excerpt' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'status' => ['required', 'string', Rule::in(['draft', 'publish'])],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string'],
            'seo_keywords' => ['nullable', 'string'],
            'published_at' => ['nullable', 'date'],
            'blocks' => ['nullable', 'array'],
            'blocks.*.block_id' => [
                'required',
                'integer',
                Rule::exists('blocks', 'id')->where(
                    fn ($query) => $query->where('page_id', $page->id)
                ),
            ],
            'blocks.*.translations' => ['nullable', 'array'],
            'blocks.*.translations.*' => ['nullable', 'string'],
        ];
    }
}
