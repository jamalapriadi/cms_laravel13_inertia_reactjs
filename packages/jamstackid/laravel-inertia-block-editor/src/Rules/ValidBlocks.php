<?php

namespace JamstackId\InertiaBlockEditor\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidBlocks implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $blocks = is_string($value) ? json_decode($value, true) : $value;

        if (is_string($value) && json_last_error() !== JSON_ERROR_NONE) {
            $fail('The :attribute must contain valid block JSON.');

            return;
        }

        if (! is_array($blocks)) {
            $fail('The :attribute must be a block array.');

            return;
        }

        $this->validateBlocks($blocks, $fail);
    }

    private function validateBlocks(array $blocks, Closure $fail): void
    {
        $allowedTypes = config('inertia-block-editor.allowed_types', []);

        foreach ($blocks as $block) {
            if (! is_array($block)) {
                $fail('Each block must be an object.');

                return;
            }

            if (empty($block['type']) || ! is_string($block['type'])) {
                $fail('Each block must have a type.');

                return;
            }

            if (! in_array($block['type'], $allowedTypes, true)) {
                $fail("The block type [{$block['type']}] is not supported.");

                return;
            }

            if (isset($block['data']) && ! is_array($block['data'])) {
                $fail('Block data must be an object.');

                return;
            }

            if (isset($block['styles']) && ! is_array($block['styles'])) {
                $fail('Block styles must be an object.');

                return;
            }

            if (isset($block['children'])) {
                if (! is_array($block['children'])) {
                    $fail('Block children must be an array.');

                    return;
                }

                $this->validateBlocks($block['children'], $fail);
            }
        }
    }
}
