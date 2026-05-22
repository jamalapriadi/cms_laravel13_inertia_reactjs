<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidPostBlocks implements ValidationRule
{
    /**
     * @var array<int, string>
     */
    private array $allowedTypes = [
        'section',
        'container',
        'column',
        'columns',
        'flex-row',
        'flex-column',
        'card',
        'tabs',
        'accordion',
        'slider',
        'grid',
        'grid-item',
        'text',
        'paragraph',
        'rich-editor',
        'heading',
        'image',
        'button',
        'icon',
        'divider',
        'spacer',
        'list',
        'quote',
        'code',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $blocks = json_decode((string) $value, true);

        if (json_last_error() !== JSON_ERROR_NONE || ! is_array($blocks)) {
            $fail('The :attribute must contain valid block JSON.');

            return;
        }

        $this->validateBlocks($blocks, $fail);
    }

    /**
     * @param  array<int, mixed>  $blocks
     */
    private function validateBlocks(array $blocks, Closure $fail): void
    {
        foreach ($blocks as $block) {
            if (! is_array($block)) {
                $fail('Each block must be an object.');

                return;
            }

            if (empty($block['type']) || ! is_string($block['type'])) {
                $fail('Each block must have a type.');

                return;
            }

            if (! in_array($block['type'], $this->allowedTypes, true)) {
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
