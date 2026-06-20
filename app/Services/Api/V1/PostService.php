<?php

namespace App\Services\Api\V1;

use App\Models\Block;
use App\Models\Dashboard\Language;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\PostTranslation;
use App\Models\TermTaxonomy;
use App\Services\Cms\LanguageManager;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class PostService
{
    public function __construct(
        private readonly LanguageManager $languageManager
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Post>
     */
    public function paginatePublished(array $filters): LengthAwarePaginator
    {
        $language = $this->resolveLanguage($filters['locale'] ?? $filters['language'] ?? null);
        $fallbackLanguage = $this->defaultLanguage();
        $perPage = (int) ($filters['per_page'] ?? 10);

        $posts = $this->basePublishedQuery()
            ->with([
                'featuredImage',
                'metas',
                'taxonomies.term',
                'translations',
            ])
            ->when($filters['search'] ?? null, function (Builder $query, string $search) use ($language): void {
                $this->applySearch($query, $search, $language);
            })
            ->when($filters['category'] ?? null, function (Builder $query, string $category): void {
                $this->applyCategory($query, $category);
            });

        $this->applySort($posts, (string) ($filters['sort'] ?? 'latest'));

        $paginator = $posts->paginate($perPage)->withQueryString();

        $this->hydratePosts($paginator->getCollection(), $language, $fallbackLanguage);

        return $paginator;
    }

    public function findPublishedBySlug(string $slug, ?string $languageCode = null): ?Post
    {
        $language = $this->resolveLanguage($languageCode);
        $fallbackLanguage = $this->defaultLanguage();

        $post = $this->basePublishedQuery()
            ->with([
                'featuredImage',
                'metas',
                'taxonomies.term',
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

        if (! $post) {
            return null;
        }

        $this->hydratePosts(collect([$post]), $language, $fallbackLanguage, withBlocks: true);

        return $post;
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
        return Post::query()
            ->where('type', 'post')
            ->where('status', 'publish')
            ->where(function (Builder $query): void {
                $query->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            });
    }

    private function applySearch(Builder $query, string $search, ?Language $language): void
    {
        $query->where(function (Builder $searchQuery) use ($search, $language): void {
            $searchQuery
                ->where('title', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
                ->orWhere('content', 'like', "%{$search}%")
                ->orWhereHas('translations', function (Builder $translationQuery) use ($search, $language): void {
                    if ($language) {
                        $translationQuery->where('language_id', $language->id);
                    }

                    $translationQuery->where(function (Builder $nestedQuery) use ($search): void {
                        $nestedQuery
                            ->where('title', 'like', "%{$search}%")
                            ->orWhere('slug', 'like', "%{$search}%")
                            ->orWhere('content', 'like', "%{$search}%");
                    });
                });
        });
    }

    private function applyCategory(Builder $query, string $slug): void
    {
        $slug = Str::slug($slug);
        $postCategoryIds = PostCategory::query()
            ->where('slug', $slug)
            ->pluck('id')
            ->all();
        $hasTaxonomyCategory = TermTaxonomy::query()
            ->where('taxonomy', 'categories')
            ->whereHas('term', fn (Builder $termQuery) => $termQuery->where('slug', $slug))
            ->exists();

        if ($slug === 'news' && $postCategoryIds === [] && ! $hasTaxonomyCategory) {
            return;
        }

        $query->where(function (Builder $categoryQuery) use ($slug, $postCategoryIds, $hasTaxonomyCategory): void {
            if ($hasTaxonomyCategory) {
                $categoryQuery->whereHas('taxonomies', function (Builder $taxonomyQuery) use ($slug): void {
                    $taxonomyQuery
                        ->where('taxonomy', 'categories')
                        ->whereHas('term', fn (Builder $termQuery) => $termQuery->where('slug', $slug));
                });
            }

            if ($postCategoryIds !== []) {
                $categoryQuery->{$hasTaxonomyCategory ? 'orWhereHas' : 'whereHas'}('metas', function (Builder $metaQuery) use ($postCategoryIds): void {
                    $metaQuery
                        ->where('meta_key', 'post_category_id')
                        ->whereIn('meta_value', $postCategoryIds);
                });
            }
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
     * @param  Collection<int, Post>|EloquentCollection<int, Post>  $posts
     */
    private function hydratePosts(Collection|EloquentCollection $posts, ?Language $language, ?Language $fallbackLanguage, bool $withBlocks = false): void
    {
        $postCategories = $this->postCategoriesFor($posts);

        $posts->each(function (Post $post) use ($language, $fallbackLanguage, $postCategories, $withBlocks): void {
            $post->setRelation(
                'apiResolvedTranslation',
                $this->resolvePublishedTranslation($post, $language, $fallbackLanguage)
            );

            $post->setRelation(
                'apiPostCategory',
                $postCategories->get($this->postCategoryId($post))
            );

            $post->setAttribute('api_language', $this->languagePayload($language));

            if ($withBlocks) {
                $post->setRelation(
                    'apiBlocksTree',
                    $this->buildBlockTree($post->blocks, $language, $fallbackLanguage)
                );
            }
        });
    }

    /**
     * @param  Collection<int, Post>|EloquentCollection<int, Post>  $posts
     * @return Collection<string, PostCategory>
     */
    private function postCategoriesFor(Collection|EloquentCollection $posts): Collection
    {
        $categoryIds = $posts
            ->map(fn (Post $post) => $this->postCategoryId($post))
            ->filter()
            ->unique()
            ->values();

        if ($categoryIds->isEmpty()) {
            return collect();
        }

        return PostCategory::query()
            ->whereIn('id', $categoryIds)
            ->get()
            ->keyBy('id');
    }

    private function postCategoryId(Post $post): ?string
    {
        $meta = $post->relationLoaded('metas')
            ? $post->metas->firstWhere('meta_key', 'post_category_id')
            : $post->metas()->where('meta_key', 'post_category_id')->first();

        return is_string($meta?->meta_value) && $meta->meta_value !== ''
            ? $meta->meta_value
            : null;
    }

    private function resolvePublishedTranslation(Post $post, ?Language $language, ?Language $fallbackLanguage): ?PostTranslation
    {
        foreach ([$language, $fallbackLanguage] as $candidateLanguage) {
            if (! $candidateLanguage) {
                continue;
            }

            $translation = $post->translationForLanguage($candidateLanguage->id);

            if ($translation && $this->translationIsPublished($translation)) {
                return $translation;
            }
        }

        return null;
    }

    private function translationIsPublished(PostTranslation $translation): bool
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
