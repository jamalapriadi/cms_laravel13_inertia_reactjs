<?php

namespace JamstackId\InertiaBlockEditor\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use JamstackId\InertiaBlockEditor\Models\ContentBlock;

class BlockTreeService
{
    public function sync(Model $blockable, array|string|null $blocks): void
    {
        $tree = $this->normalizeBlocks($blocks);

        DB::transaction(function () use ($blockable, $tree) {
            $blockable->blocks()->delete();

            $this->store($blockable, $tree);
        });
    }

    public function tree(Model $blockable): array
    {
        $blocks = $blockable->blocks()
            ->orderBy('sort_order')
            ->get();

        return $this->buildTree($blocks);
    }

    public function snapshot(Model $blockable): string
    {
        return json_encode($this->tree($blockable), JSON_THROW_ON_ERROR);
    }

    public function normalizeBlocks(array|string|null $blocks): array
    {
        if ($blocks === null || $blocks === '') {
            return [];
        }

        if (is_string($blocks)) {
            $decoded = json_decode($blocks, true);

            return is_array($decoded) ? $decoded : [];
        }

        return $blocks;
    }

    private function store(Model $blockable, array $blocks, ?int $parentId = null): void
    {
        foreach ($blocks as $index => $block) {
            $contentBlock = new ContentBlock([
                'parent_id' => $parentId,
                'type' => $block['type'],
                'props' => $block['data'] ?? [],
                'styles' => $block['styles'] ?? [],
                'sort_order' => $index,
            ]);

            $contentBlock->blockable()->associate($blockable);
            $contentBlock->save();

            if (! empty($block['children']) && is_array($block['children'])) {
                $this->store($blockable, $block['children'], $contentBlock->id);
            }
        }
    }

    private function buildTree(Collection $blocks, ?int $parentId = null): array
    {
        return $blocks
            ->where('parent_id', $parentId)
            ->sortBy('sort_order')
            ->map(fn (ContentBlock $block) => [
                'id' => $block->id,
                'type' => $block->type,
                'data' => $block->props ?? [],
                'styles' => $block->styles ?? [],
                'children' => $this->buildTree($blocks, $block->id),
            ])
            ->values()
            ->all();
    }
}
