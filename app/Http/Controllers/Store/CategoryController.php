<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\Category\CategoryRequest;
use App\Http\Requests\Store\Category\CategoryUpdateRequest;
use App\Models\Shop\Category;
use App\Support\MediaPath;
use App\Support\UniqueSlug;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $this->filtersFromRequest($request);

        $props = list_cache()->rememberRequest('categories', $request, function () use ($filters) {
            $categories = $this->categoryIndexQuery($filters)
                ->paginate(10)
                ->withQueryString();

            $this->transformCategories($categories);

            return [
                'categories' => $categories,
                'parentOptions' => $this->parentOptions(),
                'filters' => $filters,
            ];
        });

        return Inertia::render('Dashboard/Store/Category/Index', $props);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $categories = Category::query()
            ->select('id', 'name')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Dashboard/Store/Category/Create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CategoryRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = UniqueSlug::make(Category::class, $data['name']);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('categories', 'public');
        } elseif ($mediaPath = MediaPath::normalize($request->input('image'))) {
            $data['image'] = $mediaPath;
        }

        Category::create($data);

        return redirect()->route('categories.index')->with('success', 'Category created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Category $category)
    {
        $categories = Category::query()
            ->select('id', 'name')
            ->where('id', '!=', $category->id)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Dashboard/Store/Category/Edit', [
            'category' => $category,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CategoryUpdateRequest $request, Category $category)
    {
        $data = Arr::except($request->validated(), ['image']);

        if (isset($data['name']) && $data['name'] !== $category->name) {
            $data['slug'] = UniqueSlug::make(Category::class, $data['name'], ignoreId: $category->id);
        }

        if ($request->hasFile('image')) {
            if ($category->image) {
                Storage::disk('public')->delete($category->image);
            }
            $data['image'] = $request->file('image')->store('categories', 'public');
        } elseif ($request->has('image') && $request->input('image') === '') {
            $data['image'] = null;
        } elseif ($request->filled('image')) {
            $data['image'] = MediaPath::normalize($request->input('image')) ?? $category->image;
        }

        $category->update($data);

        return redirect()->route('categories.index')->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category)
    {
        $category->loadCount(['children', 'products']);

        if ($category->children_count > 0) {
            return redirect()
                ->route('categories.index')
                ->with('error', 'Delete or move the child categories first before removing this category.');
        }

        if ($category->products_count > 0) {
            return redirect()
                ->route('categories.index')
                ->with('error', 'Move or delete the products in this category before removing it.');
        }

        $category->delete();

        return redirect()->route('categories.index')->with('success', 'Category deleted successfully.');
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function categoryIndexQuery(array $filters): Builder
    {
        $query = Category::query()
            ->select([
                'id',
                'parent_id',
                'name',
                'slug',
                'sort_order',
                'show_home',
                'is_publish',
                'created_at',
            ])
            ->with([
                'parent:id,parent_id,name,slug,is_publish',
                'children' => fn ($childrenQuery) => $childrenQuery
                    ->select(['id', 'parent_id', 'name', 'slug', 'is_publish', 'sort_order'])
                    ->withCount(['children', 'products'])
                    ->orderBy('sort_order')
                    ->orderBy('name'),
            ])
            ->withCount(['children', 'products']);

        $this->applySearch($query, $filters['search'] ?? null);
        $this->applyStructureFilters($query, $filters);
        $this->applySorting($query, $filters['sort'] ?? null);

        return $query;
    }

    private function parentOptions(): array
    {
        $categories = Category::query()
            ->select(['id', 'parent_id', 'name', 'slug'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $lookup = $categories
            ->mapWithKeys(fn (Category $category) => [$category->id => $this->categorySnapshot($category)]);

        return $categories
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'hierarchy' => $this->categoryPath($this->categorySnapshot($category), $lookup),
            ])
            ->values()
            ->all();
    }

    private function transformCategories(LengthAwarePaginator $categories): void
    {
        $lookup = $this->categoryLookupFor($categories->getCollection());

        $categories->setCollection(
            $categories->getCollection()->map(
                fn (Category $category) => $this->categoryPayload($category, $lookup)
            )
        );
    }

    /**
     * Build a lightweight lookup that includes the current page and any missing ancestors
     * so the UI can render safe hierarchy paths without triggering extra queries per row.
     *
     * @param  Collection<int, Category>  $categories
     * @return Collection<string, array{id: string, parent_id: string|null, name: string, slug: string}>
     */
    private function categoryLookupFor(Collection $categories): Collection
    {
        $lookup = $categories
            ->mapWithKeys(fn (Category $category) => [$category->id => $this->categorySnapshot($category)]);

        $pendingParentIds = $categories->pluck('parent_id')->filter()->unique()->values();

        while ($pendingParentIds->isNotEmpty()) {
            $missingParentIds = $pendingParentIds
                ->reject(fn (string $parentId) => $lookup->has($parentId))
                ->values();

            if ($missingParentIds->isEmpty()) {
                break;
            }

            $ancestors = Category::query()
                ->select(['id', 'parent_id', 'name', 'slug'])
                ->whereIn('id', $missingParentIds)
                ->get();

            if ($ancestors->isEmpty()) {
                break;
            }

            foreach ($ancestors as $ancestor) {
                $lookup->put($ancestor->id, $this->categorySnapshot($ancestor));
            }

            $pendingParentIds = $ancestors->pluck('parent_id')->filter()->unique()->values();
        }

        return $lookup;
    }

    /**
     * @param  Collection<string, array{id: string, parent_id: string|null, name: string, slug: string}>  $lookup
     * @return array<string, mixed>
     */
    private function categoryPayload(Category $category, Collection $lookup): array
    {
        $snapshot = $this->categorySnapshot($category);

        return [
            'id' => $category->id,
            'parent_id' => $category->parent_id,
            'name' => $category->name,
            'slug' => $category->slug,
            'sort_order' => (int) $category->sort_order,
            'show_home' => (bool) $category->show_home,
            'is_publish' => (bool) $category->is_publish,
            'created_at' => $category->created_at?->toIso8601String(),
            'hierarchy' => $this->categoryPath($snapshot, $lookup),
            'children_count' => (int) $category->children_count,
            'products_count' => (int) $category->products_count,
            'parent' => $category->parent
                ? [
                    'id' => $category->parent->id,
                    'name' => $category->parent->name,
                    'slug' => $category->parent->slug,
                    'hierarchy' => $this->categoryPath($this->categorySnapshot($category->parent), $lookup),
                ]
                : null,
            'children' => $category->children
                ->map(fn (Category $child) => [
                    'id' => $child->id,
                    'parent_id' => $child->parent_id,
                    'name' => $child->name,
                    'slug' => $child->slug,
                    'hierarchy' => $this->categoryPath($this->categorySnapshot($child), $lookup),
                    'children_count' => (int) $child->children_count,
                    'products_count' => (int) $child->products_count,
                    'is_publish' => (bool) $child->is_publish,
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array{id: string, parent_id: string|null, name: string, slug: string}
     */
    private function categorySnapshot(Category $category): array
    {
        return [
            'id' => $category->id,
            'parent_id' => $category->parent_id,
            'name' => $category->name,
            'slug' => $category->slug,
        ];
    }

    /**
     * @param  array{id: string, parent_id: string|null, name: string, slug: string}  $category
     * @param  Collection<string, array{id: string, parent_id: string|null, name: string, slug: string}>  $lookup
     */
    private function categoryPath(array $category, Collection $lookup): string
    {
        $segments = [$category['name']];
        $seenIds = [$category['id'] => true];
        $parentId = $category['parent_id'];

        while ($parentId && $lookup->has($parentId) && ! isset($seenIds[$parentId])) {
            /** @var array{id: string, parent_id: string|null, name: string, slug: string} $parent */
            $parent = $lookup->get($parentId);
            array_unshift($segments, $parent['name']);
            $seenIds[$parentId] = true;
            $parentId = $parent['parent_id'];
        }

        return implode(' > ', $segments);
    }

    private function applySearch(Builder $query, ?string $search): void
    {
        if (! $search) {
            return;
        }

        $keyword = '%'.$search.'%';

        $query->where(function (Builder $searchQuery) use ($keyword) {
            $searchQuery
                ->where('name', 'like', $keyword)
                ->orWhere('slug', 'like', $keyword)
                ->orWhereHas('parent', function (Builder $parentQuery) use ($keyword) {
                    $parentQuery->where(function (Builder $parentSearchQuery) use ($keyword) {
                        $parentSearchQuery
                            ->where('name', 'like', $keyword)
                            ->orWhere('slug', 'like', $keyword);
                    });
                })
                ->orWhereHas('children', function (Builder $childrenQuery) use ($keyword) {
                    $childrenQuery->where(function (Builder $childrenSearchQuery) use ($keyword) {
                        $childrenSearchQuery
                            ->where('name', 'like', $keyword)
                            ->orWhere('slug', 'like', $keyword);
                    });
                });
        });
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function applyStructureFilters(Builder $query, array $filters): void
    {
        match ($filters['type'] ?? null) {
            'parent', 'no-parent' => $query->whereNull('parent_id'),
            'child', 'has-parent' => $query->whereNotNull('parent_id'),
            'has-children' => $query->has('children'),
            'no-children' => $query->doesntHave('children'),
            default => null,
        };

        if (! empty($filters['parent_id'])) {
            $query->where('parent_id', $filters['parent_id']);
        }

        if (($filters['has_children'] ?? null) !== null) {
            ($filters['has_children'] === true)
                ? $query->has('children')
                : $query->doesntHave('children');
        }

        if (($filters['has_products'] ?? null) !== null) {
            ($filters['has_products'] === true)
                ? $query->has('products')
                : $query->doesntHave('products');
        }
    }

    private function applySorting(Builder $query, ?string $sort): void
    {
        match ($sort) {
            'oldest' => $query->reorder()->oldest()->orderBy('name'),
            'name_asc' => $query->reorder()->orderBy('name')->orderBy('sort_order'),
            'name_desc' => $query->reorder()->orderByDesc('name')->orderBy('sort_order'),
            'most_children' => $query->reorder()->orderByDesc('children_count')->orderBy('name'),
            'most_products' => $query->reorder()->orderByDesc('products_count')->orderBy('name'),
            'parent_first' => $query->reorder()
                ->orderByRaw('case when parent_id is null then 0 else 1 end')
                ->orderBy('name'),
            'child_first' => $query->reorder()
                ->orderByRaw('case when parent_id is null then 1 else 0 end')
                ->orderBy('name'),
            default => $query->reorder()->orderBy('sort_order')->latest()->orderBy('name'),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function filtersFromRequest(Request $request): array
    {
        $allowedTypes = [
            'parent',
            'child',
            'has-parent',
            'no-parent',
            'has-children',
            'no-children',
        ];

        $allowedSorts = [
            'default',
            'oldest',
            'name_asc',
            'name_desc',
            'most_children',
            'most_products',
            'parent_first',
            'child_first',
        ];

        $type = $request->string('type')->trim()->value();
        $sort = $request->string('sort')->trim()->value();
        $search = $request->string('search')->trim()->value();
        $parentId = $request->string('parent_id')->trim()->value();

        return [
            'search' => $search !== '' ? $search : null,
            'type' => in_array($type, $allowedTypes, true) ? $type : null,
            'parent_id' => $parentId !== '' ? $parentId : null,
            'has_children' => $this->normalizeBoolean($request->query('has_children')),
            'has_products' => $this->normalizeBoolean($request->query('has_products')),
            'sort' => in_array($sort, $allowedSorts, true) ? $sort : 'default',
        ];
    }

    private function normalizeBoolean(mixed $value): ?bool
    {
        return match (true) {
            $value === true,
            $value === 1,
            $value === '1',
            $value === 'true' => true,
            $value === false,
            $value === 0,
            $value === '0',
            $value === 'false' => false,
            default => null,
        };
    }
}
