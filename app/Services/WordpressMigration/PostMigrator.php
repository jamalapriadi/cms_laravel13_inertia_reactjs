<?php

namespace App\Services\WordpressMigration;

use App\Models\Dashboard\Media;
use App\Models\Post;
use App\Models\PostTranslation;
use App\Models\TermTaxonomy;
use App\Services\Cms\BlockTreeService;
use App\Services\Cms\LanguageManager;
use Illuminate\Support\Facades\DB;

class PostMigrator extends BaseMigrator
{
    private BlockTreeService $blockTreeService;

    private LanguageManager $languageManager;

    public function __construct(BlockTreeService $blockTreeService, LanguageManager $languageManager)
    {
        $this->blockTreeService = $blockTreeService;
        $this->languageManager = $languageManager;
    }

    public function migrate(array &$report): void
    {
        $report['posts'] = [
            'total' => 0,
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        try {
            $wpPosts = DB::connection('wordpress')
                ->table($this->wpTable('posts'))
                ->where('post_type', 'post')
                ->whereIn('post_status', ['publish', 'draft', 'private', 'pending'])
                ->select('ID', 'post_title', 'post_name', 'post_content', 'post_status', 'post_date', 'post_author')
                ->when($this->limit, fn ($q) => $q->limit($this->limit))
                ->get();
        } catch (\Throwable $e) {
            $report['posts']['errors']++;
            logger()->error('WordPress Post Migration: Failed to query source database: '.$e->getMessage());

            return;
        }

        $report['posts']['total'] = $wpPosts->count();
        $defaultLanguage = $this->languageManager->getDefaultLanguage();
        $defaultLanguageId = $defaultLanguage ? $defaultLanguage->id : 1;

        foreach ($wpPosts as $wpPost) {
            try {
                $mappedId = $this->getMappedId($wpPost->ID, 'post');

                if ($this->dryRun) {
                    if ($mappedId) {
                        $report['posts']['updated']++;
                    } else {
                        $report['posts']['created']++;
                    }

                    continue;
                }

                $authorId = $this->resolveAuthorId($wpPost->post_author);
                $slug = $this->resolveUniqueSlug('posts', $wpPost->post_name ?: $wpPost->post_title, $mappedId, 'id');
                $status = $wpPost->post_status === 'publish' ? 'publish' : 'draft';
                $publishedAt = $wpPost->post_status === 'publish' ? $wpPost->post_date : null;

                // Decode content to rich-editor block
                $blocks = [
                    [
                        'type' => 'rich-editor',
                        'data' => [
                            'html' => $wpPost->post_content,
                        ],
                        'styles' => [],
                        'children' => [],
                    ],
                ];
                $contentJson = json_encode($blocks);

                $postData = [
                    'user_id' => $authorId,
                    'title' => $wpPost->post_title,
                    'slug' => $slug,
                    'content' => $contentJson,
                    'type' => 'post',
                    'status' => $status,
                    'published_at' => $publishedAt,
                ];

                if ($mappedId) {
                    $post = Post::find($mappedId);
                    if ($post) {
                        $post->update($postData);
                        $report['posts']['updated']++;
                    } else {
                        $post = Post::create($postData);
                        $this->recordMapping($wpPost->ID, 'post', 'posts', $post->id);
                        $report['posts']['created']++;
                    }
                } else {
                    $post = Post::create($postData);
                    $this->recordMapping($wpPost->ID, 'post', 'posts', $post->id);
                    $report['posts']['created']++;
                }

                // Sync block records for editor
                $this->blockTreeService->syncForPost($post, $blocks);

                // Create or update default language translation
                PostTranslation::updateOrCreate(
                    [
                        'post_id' => $post->id,
                        'language_id' => $defaultLanguageId,
                    ],
                    [
                        'title' => $wpPost->post_title,
                        'slug' => $slug,
                        'content' => $contentJson,
                        'status' => $status,
                        'published_at' => $publishedAt,
                    ]
                );

                // Sync Categories
                $this->syncCategories($wpPost->ID, $post);

                // Sync Tags
                $this->syncTags($wpPost->ID, $post);

                // Sync Featured Image
                $this->syncFeaturedImage($wpPost->ID, $post);

                // Sync SEO Meta
                $this->syncSeoMeta($wpPost->ID, $post);

            } catch (\Throwable $e) {
                $report['posts']['errors']++;
                logger()->error("WordPress Post Migration: Failed for ID {$wpPost->ID}: ".$e->getMessage());
            }
        }
    }

    private function syncCategories(int $wpPostId, Post $post): void
    {
        // WordPress terms relationships lookup for category
        $wpCategoryIds = DB::connection('wordpress')
            ->table($this->wpTable('term_relationships').' as tr')
            ->join($this->wpTable('term_taxonomy').' as tt', 'tr.term_taxonomy_id', '=', 'tt.term_taxonomy_id')
            ->where('tr.object_id', $wpPostId)
            ->where('tt.taxonomy', 'category')
            ->pluck('tt.term_id')
            ->all();

        $categoryUuid = null;
        foreach ($wpCategoryIds as $wpCategoryId) {
            $mappedUuid = $this->getMappedId($wpCategoryId, 'category');
            if ($mappedUuid) {
                $categoryUuid = $mappedUuid;
                break; // Laravel only maps one category per post
            }
        }

        if ($categoryUuid) {
            $post->metas()->updateOrCreate(
                ['meta_key' => 'post_category_id'],
                ['meta_value' => $categoryUuid]
            );
        } else {
            $post->metas()->where('meta_key', 'post_category_id')->delete();
        }
    }

    private function syncTags(int $wpPostId, Post $post): void
    {
        $wpTagIds = DB::connection('wordpress')
            ->table($this->wpTable('term_relationships').' as tr')
            ->join($this->wpTable('term_taxonomy').' as tt', 'tr.term_taxonomy_id', '=', 'tt.term_taxonomy_id')
            ->where('tr.object_id', $wpPostId)
            ->where('tt.taxonomy', 'post_tag')
            ->pluck('tt.term_id')
            ->all();

        $taxonomyIds = [];
        foreach ($wpTagIds as $wpTagId) {
            $mappedTaxonomyId = $this->getMappedId($wpTagId, 'tag');
            if ($mappedTaxonomyId) {
                $taxonomyIds[] = (int) $mappedTaxonomyId;
            }
        }

        $changes = $post->taxonomies()->sync($taxonomyIds);

        TermTaxonomy::whereIn('id', $changes['attached'])
            ->update(['count' => DB::raw('count + 1')]);

        TermTaxonomy::whereIn('id', $changes['detached'])
            ->where('count', '>', 0)
            ->update(['count' => DB::raw('count - 1')]);
    }

    private function syncFeaturedImage(int $wpPostId, Post $post): void
    {
        $thumbnailId = DB::connection('wordpress')
            ->table($this->wpTable('postmeta'))
            ->where('post_id', $wpPostId)
            ->where('meta_key', '_thumbnail_id')
            ->value('meta_value');

        if ($thumbnailId) {
            $mediaId = $this->getMappedId((int) $thumbnailId, 'media');
            $media = Media::find($mediaId);

            if ($media) {
                $post->metas()->updateOrCreate(
                    ['meta_key' => 'featured_image'],
                    ['meta_value' => $media->path]
                );

                return;
            }
        }

        $post->metas()->where('meta_key', 'featured_image')->delete();
    }

    private function syncSeoMeta(int $wpPostId, Post $post): void
    {
        $metaKeys = [
            '_yoast_wpseo_title' => 'seo_title',
            '_yoast_wpseo_metadesc' => 'seo_description',
            'rank_math_title' => 'seo_title',
            'rank_math_description' => 'seo_description',
        ];

        $wpMetas = DB::connection('wordpress')
            ->table($this->wpTable('postmeta'))
            ->where('post_id', $wpPostId)
            ->whereIn('meta_key', array_keys($metaKeys))
            ->pluck('meta_value', 'meta_key')
            ->all();

        foreach ($metaKeys as $wpKey => $laravelKey) {
            if (! empty($wpMetas[$wpKey])) {
                $post->metas()->updateOrCreate(
                    ['meta_key' => $laravelKey],
                    ['meta_value' => $wpMetas[$wpKey]]
                );
            }
        }
    }

    public function rollback(array &$report): void
    {
        $report['posts_rollback'] = [
            'deleted' => 0,
            'errors' => 0,
        ];

        try {
            $laravelIds = $this->deleteMappingsForType('post');

            if ($this->dryRun) {
                $report['posts_rollback']['deleted'] = count($laravelIds);

                return;
            }

            if (! empty($laravelIds)) {
                // Remove translations
                PostTranslation::whereIn('post_id', $laravelIds)->delete();

                // Clean taxonomies and metas
                DB::table('term_relationships')->whereIn('post_id', $laravelIds)->delete();
                DB::table('post_meta')->whereIn('post_id', $laravelIds)->delete();

                // Remove block tree
                foreach ($laravelIds as $postId) {
                    $blocks = DB::table('blocks')->where('post_id', $postId)->get();
                    foreach ($blocks as $block) {
                        DB::table('block_translations')->where('block_id', $block->id)->delete();
                    }
                    DB::table('blocks')->where('post_id', $postId)->delete();
                }

                $deletedCount = Post::whereIn('id', $laravelIds)->delete();
                $report['posts_rollback']['deleted'] = $deletedCount;
            }
        } catch (\Throwable $e) {
            $report['posts_rollback']['errors']++;
            logger()->error('WordPress Post Rollback Failed: '.$e->getMessage());
        }
    }
}
