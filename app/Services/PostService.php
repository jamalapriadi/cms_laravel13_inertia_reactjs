<?php

namespace App\Services;

use App\Models\Post;
use App\Models\Block;
use App\Models\TermTaxonomy;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;


class PostService
{
    public function create(array $data, int $userId)
    {
        return DB::transaction(function () use ($data) {

            // ✅ decode content
            $content = isset($data['content'])
                ? json_decode($data['content'], true)
                : null;

            // ✅ CREATE POST
            $post = Post::create([
                'user_id' => auth()->id(),
                'title' => $data['title'],
                'slug' => Str::slug($data['title']) . '-' . uniqid(),
                'status' => $data['status'],
                'type' => 'post',
                'published_at' => $data['status'] === 'publish' ? now() : null,
            ]);

            // ✅ DECODE BLOCK JSON
            $blocks = json_decode($data['content'] ?? '[]', true);

            // ✅ SIMPAN BLOCK
            $this->storeBlocks($post->id, $blocks);

            $this->syncTaxonomies($post, $data);
            $this->syncFeaturedImage($post, $data);

            return $post;
        });
    }

    public function update(Post $post, array $data)
    {
        DB::transaction(function () use ($post, $data) {

            $post->update([
                'title' => $data['title'],
                'status' => $data['status'],
                'published_at' => $data['status'] === 'publish' ? now() : null,
            ]);

            // ❌ HAPUS BLOCK LAMA
            $post->blocks()->delete();

            // ✅ SIMPAN BLOCK BARU
            $blocks = json_decode($data['blocks'] ?? '[]', true);

            $this->storeBlocks($post->id, $blocks);

            $this->syncTaxonomies($post, $data);
            $this->syncFeaturedImage($post, $data);
        });

        return $post;
    }

    private function syncTaxonomies(Post $post, array $data)
    {
        $taxonomyIds = array_merge(
            $data['categories'] ?? [],
            $data['tags'] ?? []
        );

        $post->taxonomies()->sync($taxonomyIds);

        TermTaxonomy::whereIn('id', $taxonomyIds)
            ->update(['count' => \DB::raw('count + 1')]);
    }

    private function syncFeaturedImage(Post $post, array $data)
    {
        if (!empty($data['featured_image'])) {
            $post->metas()->updateOrCreate(
                ['meta_key' => 'featured_image'],
                ['meta_value' => $data['featured_image']]
            );
        }
    }

    /**
     * 🔥 RECURSIVE BLOCK SAVE
     */
    private function storeBlocks(int $postId, array $blocks, $parentId = null)
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

            // ✅ HANDLE NESTED (kalau nanti ada children)
            if (!empty($block['children'])) {
                $this->storeBlocks(
                    $postId,
                    $block['children'],
                    $newBlock->id
                );
            }
        }
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