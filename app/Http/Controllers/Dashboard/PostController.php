<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Dashboard\Language;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\TermTaxonomy;
use App\Services\Cms\BlockTreeService;
use App\Services\Cms\LanguageManager;
use App\Services\PostService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PostController extends Controller
{
    public function index(Request $request, LanguageManager $languageManager)
    {
        $props = list_cache()->rememberRequest('posts', $request, function () use ($request, $languageManager) {
            $posts = Post::with([
                'author',
                'translations:id,post_id,language_id,status',
            ])
                ->when($request->search, function ($q) use ($request) {
                    $q->where('title', 'like', "%{$request->search}%");
                })
                ->latest();

            if ($request->filled('status')) {
                $status = $request->status;

                if ($status != 'all') {
                    $posts = $posts->where('status', $request->status);
                }

            } else {
                $posts = $posts->where('status', '!=', 'trash');
            }

            $posts = $posts->paginate(10)
                ->withQueryString();

            $enabledLanguages = $languageManager->getEnabledLanguages()
                ->map(fn (Language $language) => [
                    'id' => $language->id,
                    'code' => strtolower((string) $language->code),
                    'name' => $language->english_name,
                ])
                ->values();

            return [
                'posts' => $posts,
                'filters' => $request->only('search', 'status'),
                'enabledLanguages' => $enabledLanguages,
                'defaultLanguage' => $languageManager->getDefaultLanguage()?->only([
                    'id',
                    'code',
                    'english_name',
                ]),
            ];
        });

        return Inertia::render('Dashboard/Posts/Index', $props);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Posts/Create', [
            'categories' => PostCategory::query()
                ->select('id', 'category_name')
                ->orderBy('category_name')
                ->get(),
            'tags' => TermTaxonomy::with('term')
                ->where('taxonomy', 'tags')
                ->get(),
        ]);
    }

    public function usageGuide()
    {
        return Inertia::render('Dashboard/Posts/UsageGuide', [
            'apiBaseUrl' => rtrim((string) config('app.url'), '/').'/api',
        ]);
    }

    public function store(StorePostRequest $request, PostService $service)
    {
        $service->create($request->validated(), (int) auth()->id());

        return redirect()->route('posts.index');
    }

    public function edit(Post $post, BlockTreeService $blockTreeService)
    {
        $post->load(['tags.term', 'featuredImage', 'metas']);

        $blocks = $blockTreeService->buildEditorTree(
            $post->blocks()->orderBy('order')->get()
        );

        return Inertia::render('Dashboard/Posts/Edit', [
            'post' => $post,
            'blocks' => $blocks,
            'categoryId' => $post->metas
                ->firstWhere('meta_key', 'post_category_id')
                ?->meta_value,
            'categories' => PostCategory::query()
                ->select('id', 'category_name')
                ->orderBy('category_name')
                ->get(),
            'tags' => TermTaxonomy::with('term')
                ->where('taxonomy', 'tags')
                ->get(),
        ]);
    }

    public function update(UpdatePostRequest $request, Post $post, PostService $service)
    {
        $service->update($post, $request->validated());

        return redirect()->route('posts.index');
    }

    public function destroy(Post $post, PostService $service)
    {
        $service->trash($post);

        return back();
    }

    public function restore(Post $post, PostService $service)
    {
        $service->restore($post);

        return back();
    }

    public function forceDelete(Post $post, PostService $service)
    {
        $service->forceDelete($post);

        return back();
    }
}
