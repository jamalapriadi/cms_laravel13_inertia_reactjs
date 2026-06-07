<?php

namespace App\Services\Cms;

use App\Models\Block;
use App\Models\Page;
use App\Models\Post;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;

class BlockTreeService
{
    public function syncForPost(Post $post, array $blocks): void
    {
        $post->blocks()->delete();
        $this->store($blocks, postId: $post->id);
    }

    public function syncForPage(Page $page, array $blocks): void
    {
        $page->blocks()->delete();
        $this->store($blocks, pageId: $page->id);
    }

    public function decode(?string $blocks): array
    {
        if (empty($blocks)) {
            return [];
        }

        $decoded = json_decode($blocks, true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * @param  EloquentCollection<int, Block>|Collection<int, Block>  $blocks
     * @return Collection<int, array<string, mixed>>
     */
    public function buildEditorTree(EloquentCollection|Collection $blocks, ?int $parentId = null): Collection
    {
        return $blocks
            ->where('parent_id', $parentId)
            ->map(fn (Block $block) => [
                'id' => $block->id,
                'type' => $block->type,
                'data' => $block->props ?? [],
                'styles' => $block->styles ?? [],
                'children' => $this->buildEditorTree($blocks, $block->id)->values(),
            ])
            ->values();
    }

    /**
     * @param  array<int, mixed>  $blocks
     */
    private function store(array $blocks, ?int $postId = null, ?int $pageId = null, ?int $parentId = null): void
    {
        foreach ($blocks as $index => $block) {
            if (! is_array($block) || empty($block['type'])) {
                continue;
            }

            $newBlock = Block::query()->create([
                'post_id' => $postId,
                'page_id' => $pageId,
                'parent_id' => $parentId,
                'type' => $block['type'],
                'props' => $block['data'] ?? [],
                'styles' => $block['styles'] ?? [],
                'order' => $index,
            ]);

            if (! empty($block['children']) && is_array($block['children'])) {
                $this->store(
                    $block['children'],
                    postId: $postId,
                    pageId: $pageId,
                    parentId: $newBlock->id
                );
            }
        }
    }
}
