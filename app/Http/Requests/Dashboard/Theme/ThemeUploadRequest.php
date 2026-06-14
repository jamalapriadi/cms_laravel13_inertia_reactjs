<?php

namespace App\Http\Requests\Dashboard\Theme;

use Illuminate\Foundation\Http\FormRequest;

class ThemeUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'archive' => ['required', 'file', 'mimes:zip', 'max:51200'],
        ];
    }
}
