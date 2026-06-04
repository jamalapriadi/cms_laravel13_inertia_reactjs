<?php

// app/Http/Controllers/Dashboard/PostCategoryController.php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\PostCategoryStoreRequest;
use App\Http\Requests\PostCategoryUpdateRequest;
use App\Models\PostCategory;
use App\Services\PostCategoryService;
use Inertia\Inertia;

class PostCategoryController extends Controller
{
    public function __construct(private PostCategoryService $service) {}

    public function index()
    {
        $filters = request()->only(['search', 'parent_id']);

        $props = list_cache()->rememberRequest('post-categories', request(), function () use ($filters) {
            return [
                'categories' => $this->service->getPaginated($filters),
                'parents' => PostCategory::select('id', 'category_name')->get(),
                'filters' => $filters,
            ];
        });

        return Inertia::render('Dashboard/PostCategories/Index', $props);
    }

    public function create()
    {
        return Inertia::render('Dashboard/PostCategories/Create', [
            'parents' => PostCategory::select('id', 'category_name')->get(),
        ]);
    }

    public function store(PostCategoryStoreRequest $request)
    {
        $this->service->create($request->validated());

        return redirect()->route('post-categories.index');
    }

    public function edit(PostCategory $postCategory)
    {
        return Inertia::render('Dashboard/PostCategories/Edit', [
            'category' => $postCategory,
            'parents' => PostCategory::select('id', 'category_name')->get(),
        ]);
    }

    public function update(PostCategoryUpdateRequest $request, PostCategory $postCategory)
    {
        $this->service->update($postCategory, $request->validated());

        return redirect()->route('post-categories.index');
    }

    public function destroy(PostCategory $postCategory)
    {
        $this->service->delete($postCategory);

        return back();
    }
}
