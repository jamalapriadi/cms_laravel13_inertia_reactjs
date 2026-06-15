<?php

namespace App\Http\Requests\Permission;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePermissionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:permissions,name,'.$this->permission->id,
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
