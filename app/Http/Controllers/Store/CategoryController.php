<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\Category\CategoryRequest;
use App\Http\Requests\Store\Category\CategoryUpdateRequest;
use App\Models\Shop\Category;
use App\Support\MediaPath;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->query('search');

        $props = list_cache()->rememberRequest('categories', $request, function () use ($search) {
            $categories = Category::query()
                ->with('parent')
                ->when($search, function ($query, $search) {
                    $query->where('name', 'like', "%{$search}%");
                })
                ->orderBy('sort_order', 'asc')
                ->latest()
                ->paginate(10)
                ->withQueryString();

            return [
                'categories' => $categories,
                'filters' => ['search' => $search],
            ];
        });

        return Inertia::render('Dashboard/Store/Category/Index', $props);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $categories = Category::select('id', 'name')->get();

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
        $data['slug'] = Str::slug($data['name']);

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
        // Get categories except itself to prevent circular parent reference
        $categories = Category::select('id', 'name')
            ->where('id', '!=', $category->id)
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
            $data['slug'] = Str::slug($data['name']);
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
        $category->delete();

        return redirect()->route('categories.index')->with('success', 'Category deleted successfully.');
    }
}
