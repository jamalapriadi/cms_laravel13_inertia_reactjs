<?php

namespace App\Support;

final class ContentEditorMode
{
    public const CLASSIC = 'classic_editor';

    public const BLOCK = 'block_editor';

    /**
     * @return array<int, string>
     */
    public static function allowed(): array
    {
        return [
            self::CLASSIC,
            self::BLOCK,
        ];
    }

    public static function normalize(mixed $value): string
    {
        return in_array($value, self::allowed(), true)
            ? $value
            : self::BLOCK;
    }

    public static function extractClassicContent(array $blocks, ?string $storedContent = null): ?string
    {
        $classicContent = self::extractClassicContentFromBlocks($blocks);

        if ($classicContent !== null) {
            return $classicContent;
        }

        if ($blocks !== []) {
            return null;
        }

        if ($storedContent === null) {
            return '';
        }

        $trimmedContent = trim($storedContent);

        if ($trimmedContent === '') {
            return '';
        }

        $decoded = json_decode($storedContent, true);

        if (is_array($decoded) && array_is_list($decoded)) {
            return self::extractClassicContentFromBlocks($decoded);
        }

        return $storedContent;
    }

    private static function extractClassicContentFromBlocks(array $blocks): ?string
    {
        if ($blocks === []) {
            return '';
        }

        if (! array_is_list($blocks) || count($blocks) !== 1) {
            return null;
        }

        $block = $blocks[0];

        if (! is_array($block) || ($block['type'] ?? null) !== 'rich-editor') {
            return null;
        }

        $children = $block['children'] ?? [];

        if (is_array($children) && $children !== []) {
            return null;
        }

        $data = $block['data'] ?? [];

        if (! is_array($data)) {
            return '';
        }

        $content = $data['html'] ?? $data['text'] ?? '';

        return is_string($content) ? $content : '';
    }
}
