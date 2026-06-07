<?php

namespace App\Services\Api\V1;

use App\Models\Block;
use App\Models\Dashboard\Language;
use App\Models\Page;
use App\Models\PageTranslation;
use App\Services\Cms\LanguageManager;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;

class PageService
{
    public function __construct(
        private readonly LanguageManager $languageManager
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Page>
     */
    public function paginatePublished(array $filters): LengthAwarePaginator
    {
        $language = $this->resolveLanguage($filters['locale'] ?? $filters['language'] ?? null);
        $fallbackLanguage = $this->defaultLanguage();
        $perPage = (int) ($filters['per_page'] ?? 10);

        $pages = $this->basePublishedQuery()
            ->with(['translations'])
            ->when($filters['search'] ?? null, function (Builder $query, string $search) use ($language): void {
                $this->applySearch($query, $search, $language);
            });

        $this->applySort($pages, (string) ($filters['sort'] ?? 'latest'));

        $paginator = $pages->paginate($perPage)->withQueryString();

        $this->hydratePages($paginator->getCollection(), $language, $fallbackLanguage);

        return $paginator;
    }

    public function findPublishedBySlug(string $slug, ?string $languageCode = null): ?Page
    {
        $language = $this->resolveLanguage($languageCode);
        $fallbackLanguage = $this->defaultLanguage();

        $page = $this->basePublishedQuery()
            ->with([
                'translations',
                'blocks' => fn ($query) => $query->orderBy('order'),
                'blocks.translations',
            ])
            ->where(function (Builder $query) use ($slug, $language): void {
                $query->where('slug', $slug)
                    ->orWhereHas('translations', function (Builder $translationQuery) use ($slug, $language): void {
                        $translationQuery->where('slug', $slug);

                        if ($language) {
                            $translationQuery->where('language_id', $language->id);
                        }

                        $this->applyPublishedTranslation($translationQuery);
                    });
            })
            ->first();

        if (! $page) {
            return null;
        }

        $this->hydratePages(collect([$page]), $language, $fallbackLanguage, withBlocks: true);

        return $page;
    }

    public function resolveLanguage(mixed $code): ?Language
    {
        return $this->languageManager->resolveLanguageByLocale(is_string($code) ? $code : null);
    }

    private function defaultLanguage(): ?Language
    {
        return $this->languageManager->getDefaultLanguage();
    }

    private function basePublishedQuery(): Builder
    {
        return Page::query()->published();
    }

    private function applySearch(Builder $query, string $search, ?Language $language): void
    {
        $query->where(function (Builder $searchQuery) use ($search, $language): void {
            $searchQuery
                ->where('title', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
                ->orWhere('excerpt', 'like', "%{$search}%")
                ->orWhere('content', 'like', "%{$search}%")
                ->orWhereHas('translations', function (Builder $translationQuery) use ($search, $language): void {
                    if ($language) {
                        $translationQuery->where('language_id', $language->id);
                    }

                    $translationQuery->where(function (Builder $nestedQuery) use ($search): void {
                        $nestedQuery
                            ->where('title', 'like', "%{$search}%")
                            ->orWhere('slug', 'like', "%{$search}%")
                            ->orWhere('excerpt', 'like', "%{$search}%")
                            ->orWhere('content', 'like', "%{$search}%");
                    });
                });
        });
    }

    private function applySort(Builder $query, string $sort): void
    {
        if ($sort === 'oldest') {
            $query->orderBy('published_at')->orderBy('created_at')->orderBy('id');

            return;
        }

        $query->orderByDesc('published_at')->latest('created_at')->latest('id');
    }

    private function applyPublishedTranslation(Builder $query): void
    {
        $query
            ->where('status', 'publish')
            ->where(function (Builder $publishedQuery): void {
                $publishedQuery->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            });
    }

    /**
     * @param  Collection<int, Page>|EloquentCollection<int, Page>  $pages
     */
    private function hydratePages(Collection|EloquentCollection $pages, ?Language $language, ?Language $fallbackLanguage, bool $withBlocks = false): void
    {
        $pages->each(function (Page $page) use ($language, $fallbackLanguage, $withBlocks): void {
            $page->setRelation(
                'apiResolvedTranslation',
                $this->resolvePublishedTranslation($page, $language, $fallbackLanguage)
            );

            $page->setAttribute('api_language', $this->languagePayload($language));

            if ($withBlocks) {
                $page->setRelation(
                    'apiBlocksTree',
                    $this->buildBlockTree($page->blocks, $language, $fallbackLanguage)
                );
            }
        });
    }

    private function resolvePublishedTranslation(Page $page, ?Language $language, ?Language $fallbackLanguage): ?PageTranslation
    {
        foreach ([$language, $fallbackLanguage] as $candidateLanguage) {
            if (! $candidateLanguage) {
                continue;
            }

            $translation = $page->translationForLanguage($candidateLanguage->id);

            if ($translation && $this->translationIsPublished($translation)) {
                return $translation;
            }
        }

        return null;
    }

    private function translationIsPublished(PageTranslation $translation): bool
    {
        return $translation->status === 'publish'
            && ($translation->published_at === null || $translation->published_at->lte(now()));
    }

    /**
     * @param  EloquentCollection<int, Block>  $blocks
     * @return Collection<int, Block>
     */
    private function buildBlockTree(EloquentCollection $blocks, ?Language $language, ?Language $fallbackLanguage): Collection
    {
        $blocks->each(function (Block $block) use ($language, $fallbackLanguage): void {
            $block->setAttribute(
                'api_resolved_props',
                $language
                    ? $block->resolvePropsForLanguage($language, $fallbackLanguage)
                    : (is_array($block->props) ? $block->props : [])
            );
        });

        $grouped = $blocks->groupBy('parent_id');

        $attachChildren = function (?int $parentId) use (&$attachChildren, $grouped): Collection {
            return $grouped
                ->get($parentId, collect())
                ->sortBy('order')
                ->values()
                ->map(function (Block $block) use (&$attachChildren): Block {
                    $block->setRelation('children', $attachChildren($block->id));

                    return $block;
                });
        };

        return $attachChildren(null);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function languagePayload(?Language $language): ?array
    {
        if (! $language) {
            return null;
        }

        return [
            'id' => $language->id,
            'code' => strtolower((string) $language->code),
            'name' => $language->english_name,
        ];
    }
}
