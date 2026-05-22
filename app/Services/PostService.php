<?php

namespace App\Services;

use App\Models\Block;
use App\Models\Post;
use App\Models\TermTaxonomy;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PostService
{
    public function create(array $data, int $userId): Post
    {
        return DB::transaction(function () use ($data, $userId) {
            $blocks = $this->decodeBlocks($data['content'] ?? null);

            $post = Post::create([
                'user_id' => $userId,
                'title' => $data['title'],
                'slug' => Str::slug($data['title']).'-'.uniqid(),
                'content' => json_encode($blocks),
                'status' => $data['status'],
                'type' => 'post',
                'published_at' => $data['status'] === 'publish' ? now() : null,
            ]);

            $this->storeBlocks($post->id, $blocks);
            $this->syncTaxonomies($post, $data);
            $this->syncFeaturedImage($post, $data);

            return $post;
        });
    }

    public function update(Post $post, array $data): Post
    {
        DB::transaction(function () use ($post, $data) {
            $blocks = $this->decodeBlocks($data['blocks'] ?? null);

            $post->update([
                'title' => $data['title'],
                'content' => json_encode($blocks),
                'status' => $data['status'],
                'published_at' => $data['status'] === 'publish' ? now() : null,
            ]);

            $post->blocks()->delete();
            $this->storeBlocks($post->id, $blocks);

            $this->syncTaxonomies($post, $data);
            $this->syncFeaturedImage($post, $data);
        });

        return $post;
    }

    private function syncTaxonomies(Post $post, array $data): void
    {
        $taxonomyIds = array_merge(
            $data['categories'] ?? [],
            $data['tags'] ?? []
        );

        $post->taxonomies()->sync($taxonomyIds);

        TermTaxonomy::whereIn('id', $taxonomyIds)
            ->update(['count' => \DB::raw('count + 1')]);
    }

    private function syncFeaturedImage(Post $post, array $data): void
    {
        if (! empty($data['featured_image'])) {
            $post->metas()->updateOrCreate(
                ['meta_key' => 'featured_image'],
                ['meta_value' => $data['featured_image']]
            );
        }
    }

    private function storeBlocks(int $postId, array $blocks, ?int $parentId = null): void
    {
        foreach ($blocks as $index => $block) {
            $newBlock = Block::create([
                'post_id' => $postId,
                'parent_id' => $parentId,
                'type' => $block['type'],
                'props' => $block['data'] ?? [],
                'styles' => $block['styles'] ?? [],
                'order' => $index,
            ]);

            if (! empty($block['children'])) {
                $this->storeBlocks(
                    $postId,
                    $block['children'],
                    $newBlock->id
                );
            }
        }
    }

    private function decodeBlocks(?string $blocks): array
    {
        if (empty($blocks)) {
            return [];
        }

        $decoded = json_decode($blocks, true);

        return is_array($decoded) ? $decoded : [];
    }

    public function delete(Post $post): bool
    {
        return DB::transaction(function () use ($post) {

            /**
             * 🔥 1. Hapus relationship taxonomy count (optional cleanup)
             */
            if ($post->relationLoaded('taxonomies')) {
                foreach ($post->taxonomies as $taxonomy) {
                    $taxonomy->decrement('count');
                }
            } else {
                $taxonomyIds = DB::table('term_relationships')
                    ->where('post_id', $post->id)
                    ->pluck('term_taxonomy_id');

                DB::table('term_taxonomy')
                    ->whereIn('id', $taxonomyIds)
                    ->decrement('count');
            }

            /**
             * 🔥 2. Hapus meta (optional karena cascade sudah ada)
             */
            DB::table('post_meta')
                ->where('post_id', $post->id)
                ->delete();

            /**
             * 🔥 3. Hapus pivot term relationships
             */
            DB::table('term_relationships')
                ->where('post_id', $post->id)
                ->delete();

            /**
             * 🔥 4. Hapus categories pivot (kalau pakai relation manual)
             */
            if (method_exists($post, 'categories')) {
                $post->categories()->detach();
            }

            /**
             * 🔥 5. Hapus blocks + nested children (AMAN fallback walaupun cascade sudah ada)
             */
            $this->deleteBlocks($post->id);

            /**
             * 🔥 6. Hapus post utama
             */
            return $post->delete();
        });
    }

    private function deleteBlocks(int $postId): void
    {
        $blocks = DB::table('blocks')
            ->where('post_id', $postId)
            ->get();

        foreach ($blocks as $block) {

            // delete translations dulu
            DB::table('block_translations')
                ->where('block_id', $block->id)
                ->delete();

            // delete children recursively
            $this->deleteBlockChildren($block->id);
        }

        // delete root blocks
        DB::table('blocks')
            ->where('post_id', $postId)
            ->delete();
    }

    private function deleteBlockChildren(int $parentId): void
    {
        $children = DB::table('blocks')
            ->where('parent_id', $parentId)
            ->get();

        foreach ($children as $child) {

            DB::table('block_translations')
                ->where('block_id', $child->id)
                ->delete();

            $this->deleteBlockChildren($child->id);
        }

        DB::table('blocks')
            ->where('parent_id', $parentId)
            ->delete();
    }

    public function trash(Post $post): Post
    {
        return DB::transaction(function () use ($post) {

            $post->update([
                'status' => 'trash',
                'published_at' => null,
            ]);

            return $post;
        });
    }

    public function restore(Post $post): Post
    {
        return DB::transaction(function () use ($post) {

            $post->update([
                'status' => 'draft', // atau publish kalau mau auto restore publish
            ]);

            return $post;
        });
    }

    public function forceDelete(Post $post): bool
    {
        return DB::transaction(function () use ($post) {

            // delete blocks + translations
            $this->deleteBlocks($post->id);

            // delete meta
            DB::table('post_meta')
                ->where('post_id', $post->id)
                ->delete();

            // delete taxonomy pivot
            DB::table('term_relationships')
                ->where('post_id', $post->id)
                ->delete();

            return $post->delete();
        });
    }
}
