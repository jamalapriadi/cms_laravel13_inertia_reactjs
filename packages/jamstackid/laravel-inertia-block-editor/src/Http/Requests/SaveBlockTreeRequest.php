<?php

namespace JamstackId\InertiaBlockEditor\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use JamstackId\InertiaBlockEditor\Rules\ValidBlocks;

class SaveBlockTreeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'blockable_type' => ['required', 'string', Rule::in(array_keys(config('inertia-block-editor.blockables', [])))],
            'blockable_id' => ['required', 'integer'],
            'blocks' => ['nullable', new ValidBlocks],
        ];
    }
}
