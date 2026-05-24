<?php

namespace App\Http\Requests\CustomerAuth;

use Illuminate\Foundation\Http\FormRequest;

class CustomerForgotPasswordRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
        ];
    }
}
