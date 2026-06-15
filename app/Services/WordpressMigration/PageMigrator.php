<?php

namespace App\Services\WordpressMigration;

use App\Models\Dashboard\Media as LaravelMedia;
use App\Models\Page;
use App\Models\PageTranslation;
use App\Services\Cms\BlockTreeService;
use App\Services\Cms\LanguageManager;
use Illuminate\Support\Facades\DB;

class PageMigrator extends BaseMigrator
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
        $report['pages'] = [
            'total' => 0,
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        try {
            $wpPages = DB::connection('wordpress')
                ->table($this->wpTable('posts'))
                ->where('post_type', 'page')
                ->whereIn('post_status', ['publish', 'draft', 'private', 'pending'])
                ->select('ID', 'post_title', 'post_name', 'post_content', 'post_excerpt', 'post_status', 'post_date', 'post_author')
                ->when($this->limit, fn ($q) => $q->limit($this->limit))
                ->get();
        } catch (\Throwable $e) {
            $report['pages']['errors']++;
            logger()->error('WordPress Page Migration: Failed to query source database: '.$e->getMessage());

            return;
        }

        $report['pages']['total'] = $wpPages->count();
        $defaultLanguage = $this->languageManager->getDefaultLanguage();
        $defaultLanguageId = $defaultLanguage ? $defaultLanguage->id : 1;

        foreach ($wpPages as $wpPost) {
            try {
                $mappedId = $this->getMappedId($wpPost->ID, 'page');

                if ($this->dryRun) {
                    if ($mappedId) {
                        $report['pages']['updated']++;
                    } else {
                        $report['pages']['created']++;
                    }

                    continue;
                }

                $authorId = $this->resolveAuthorId($wpPost->post_author);
                $slug = $this->resolveUniqueSlug('pages', $wpPost->post_name ?: $wpPost->post_title, $mappedId, 'id');
                $status = $wpPost->post_status === 'publish' ? 'publish' : 'draft';
                $publishedAt = $wpPost->post_status === 'publish' ? $wpPost->post_date : null;

                // Sync Featured Image path
                $featuredImagePath = $this->getFeaturedImagePath($wpPost->ID);

                // Fetch SEO Metadata
                $seoMeta = $this->getSeoMetadata($wpPost->ID);

                // Decode content to rich-editor block format
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

                $pageData = [
                    'title' => $wpPost->post_title,
                    'slug' => $slug,
                    'excerpt' => $wpPost->post_excerpt,
                    'content' => $contentJson,
                    'status' => $status,
                    'featured_image' => $featuredImagePath,
                    'seo_title' => $seoMeta['seo_title'],
                    'seo_description' => $seoMeta['seo_description'],
                    'published_at' => $publishedAt,
                    'created_by' => $authorId,
                    'updated_by' => $authorId,
                ];

                if ($mappedId) {
                    $page = Page::find($mappedId);
                    if ($page) {
                        $page->update($pageData);
                        $report['pages']['updated']++;
                    } else {
                        $page = Page::create($pageData);
                        $this->recordMapping($wpPost->ID, 'page', 'pages', $page->id);
                        $report['pages']['created']++;
                    }
                } else {
                    $page = Page::create($pageData);
                    $this->recordMapping($wpPost->ID, 'page', 'pages', $page->id);
                    $report['pages']['created']++;
                }

                // Sync block records for editor
                $this->blockTreeService->syncForPage($page, $blocks);

                // Create or update default language translation
                PageTranslation::updateOrCreate(
                    [
                        'page_id' => $page->id,
                        'language_id' => $defaultLanguageId,
                    ],
                    [
                        'title' => $wpPost->post_title,
                        'slug' => $slug,
                        'excerpt' => $wpPost->post_excerpt,
                        'content' => $contentJson,
                        'status' => $status,
                        'seo_title' => $seoMeta['seo_title'],
                        'seo_description' => $seoMeta['seo_description'],
                        'published_at' => $publishedAt,
                    ]
                );

            } catch (\Throwable $e) {
                $report['pages']['errors']++;
                logger()->error("WordPress Page Migration: Failed for ID {$wpPost->ID}: ".$e->getMessage());
            }
        }
    }

    private function getFeaturedImagePath(int $wpPageId): ?string
    {
        $thumbnailId = DB::connection('wordpress')
            ->table($this->wpTable('postmeta'))
            ->where('post_id', $wpPageId)
            ->where('meta_key', '_thumbnail_id')
            ->value('meta_value');

        if ($thumbnailId) {
            $mediaId = $this->getMappedId((int) $thumbnailId, 'media');
            $media = LaravelMedia::find($mediaId);
            if ($media) {
                return $media->path;
            }
        }

        return null;
    }

    private function getSeoMetadata(int $wpPageId): array
    {
        $metaKeys = [
            '_yoast_wpseo_title' => 'seo_title',
            '_yoast_wpseo_metadesc' => 'seo_description',
            'rank_math_title' => 'seo_title',
            'rank_math_description' => 'seo_description',
        ];

        $wpMetas = DB::connection('wordpress')
            ->table($this->wpTable('postmeta'))
            ->where('post_id', $wpPageId)
            ->whereIn('meta_key', array_keys($metaKeys))
            ->pluck('meta_value', 'meta_key')
            ->all();

        return [
            'seo_title' => $wpMetas['rank_math_title'] ?? $wpMetas['_yoast_wpseo_title'] ?? null,
            'seo_description' => $wpMetas['rank_math_description'] ?? $wpMetas['_yoast_wpseo_metadesc'] ?? null,
        ];
    }

    public function rollback(array &$report): void
    {
        $report['pages_rollback'] = [
            'deleted' => 0,
            'errors' => 0,
        ];

        try {
            $laravelIds = $this->deleteMappingsForType('page');

            if ($this->dryRun) {
                $report['pages_rollback']['deleted'] = count($laravelIds);

                return;
            }

            if (! empty($laravelIds)) {
                // Remove translations
                PageTranslation::whereIn('page_id', $laravelIds)->delete();

                // Remove block tree
                foreach ($laravelIds as $pageId) {
                    $blocks = DB::table('blocks')->where('page_id', $pageId)->get();
                    foreach ($blocks as $block) {
                        DB::table('block_translations')->where('block_id', $block->id)->delete();
                    }
                    DB::table('blocks')->where('page_id', $pageId)->delete();
                }

                $deletedCount = Page::whereIn('id', $laravelIds)->delete();
                $report['pages_rollback']['deleted'] = $deletedCount;
            }
        } catch (\Throwable $e) {
            $report['pages_rollback']['errors']++;
            logger()->error('WordPress Page Rollback Failed: '.$e->getMessage());
        }
    }
}
