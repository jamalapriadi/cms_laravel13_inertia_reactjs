<?php

namespace App\Http\Requests\Dashboard\Cms;

use App\Models\Post;
use App\Models\PostTranslation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePostTranslationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Post $post */
        $post = $this->route('post');
        $language = $this->route('language');
        $languageId = is_object($language) ? $language->id : (int) $language;
        $existingTranslationId = PostTranslation::query()
            ->where('post_id', $post->id)
            ->where('language_id', $languageId)
            ->value('id');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('post_translations', 'slug')
                    ->ignore($existingTranslationId)
                    ->where(fn ($query) => $query->where('language_id', $languageId)),
            ],
            'excerpt' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'status' => ['required', 'string', Rule::in(['draft', 'publish'])],
            'published_at' => ['nullable', 'date'],
            'blocks' => ['nullable', 'array'],
            'blocks.*.block_id' => [
                'required',
                'integer',
                Rule::exists('blocks', 'id')->where(
                    fn ($query) => $query->where('post_id', $post->id)
                ),
            ],
            'blocks.*.translations' => ['nullable', 'array'],
            'blocks.*.translations.*' => ['nullable', 'string'],
        ];
    }
}
