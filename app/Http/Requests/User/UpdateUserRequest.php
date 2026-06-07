<?php

namespace App\Http\Requests\User;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$this->user->id,
            'password' => 'nullable|min:6',
            'roles' => 'array',
            'roles.*' => 'exists:roles,name',
        ];
    }

    public function after(): array
    {
        return [
            function ($validator): void {
                $roles = $this->input('roles', []);

                if ($roles !== [] && ! $this->user()?->can('users.assign-role')) {
                    $validator->errors()->add('roles', 'You are not allowed to assign roles.');
                }

                if (in_array('super-admin', $roles, true) && ! $this->user()?->hasRole('super-admin')) {
                    $validator->errors()->add('roles', 'Only a super-admin can assign the super-admin role.');
                }
            },
        ];
    }
}
