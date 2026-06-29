<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePageRequest;
use App\Http\Requests\UpdatePageRequest;
use App\Models\Dashboard\Language;
use App\Models\Page;
use App\Services\Cms\BlockTreeService;
use App\Services\Cms\LanguageManager;
use App\Services\PageService;
use App\Support\ContentEditorMode;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PageController extends Controller
{
    public function index(Request $request, LanguageManager $languageManager)
    {
        $props = list_cache()->rememberRequest('pages', $request, function () use ($request, $languageManager) {
            $pages = Page::query()
                ->with([
                    'creator:id,name',
                    'translations:id,page_id,language_id,status',
                ])
                ->when($request->search, function ($query) use ($request): void {
                    $query->where(function ($query) use ($request): void {
                        $query
                            ->where('title', 'like', "%{$request->search}%")
                            ->orWhere('slug', 'like', "%{$request->search}%");
                    });
                })
                ->when($request->filled('status') && $request->status !== 'all', function ($query) use ($request): void {
                    $query->where('status', $request->status);
                })
                ->when(! $request->filled('status') || $request->status === 'all', function ($query): void {
                    $query->whereNotIn('status', ['auto-draft']);
                })
                ->latest()
                ->paginate(10)
                ->withQueryString();

            $enabledLanguages = $languageManager->getEnabledLanguages()
                ->map(fn (Language $language) => [
                    'id' => $language->id,
                    'code' => strtolower((string) $language->code),
                    'name' => $language->english_name,
                ])
                ->values();

            return [
                'pages' => $pages,
                'filters' => $request->only('search', 'status'),
                'enabledLanguages' => $enabledLanguages,
                'defaultLanguage' => $languageManager->getDefaultLanguage()?->only([
                    'id',
                    'code',
                    'english_name',
                ]),
            ];
        });

        return Inertia::render('Dashboard/Pages/Index', $props);
    }

    public function create()
    {
        $latestDraft = Page::where('created_by', auth()->id())
            ->where('status', 'auto-draft')
            ->latest('id')
            ->first();

        $latestDraftData = null;
        if ($latestDraft && (
            ($latestDraft->title !== 'Auto Draft' && ! empty($latestDraft->title)) ||
            ! empty($latestDraft->excerpt) ||
            (! empty($latestDraft->content) && $latestDraft->content !== '[]')
        )) {
            $latestDraftData = [
                'id' => $latestDraft->id,
                'title' => $latestDraft->title,
                'updated_at' => $latestDraft->updated_at->diffForHumans(),
            ];
        }

        return Inertia::render('Dashboard/Pages/Create', [
            'editorMode' => ContentEditorMode::normalize(
                get_option('default_content_editor', ContentEditorMode::BLOCK)
            ),
            'latestDraft' => $latestDraftData,
        ]);
    }

    public function store(StorePageRequest $request, PageService $service)
    {
        $service->create($request->validated(), (int) auth()->id());

        return redirect()->route('pages.index');
    }

    public function edit(Page $page, BlockTreeService $blockTreeService)
    {
        $blocks = $blockTreeService->buildEditorTree(
            $page->blocks()->orderBy('order')->get()
        )->all();

        $preferredEditorMode = ContentEditorMode::normalize(
            get_option('default_content_editor', ContentEditorMode::BLOCK)
        );
        $classicContent = ContentEditorMode::extractClassicContent($blocks, $page->content);
        $editorMode = $preferredEditorMode === ContentEditorMode::CLASSIC
            && $classicContent !== null
            ? ContentEditorMode::CLASSIC
            : ContentEditorMode::BLOCK;

        return Inertia::render('Dashboard/Pages/Edit', [
            'page' => $page,
            'blocks' => $blocks,
            'editorMode' => $editorMode,
            'classicContent' => $editorMode === ContentEditorMode::CLASSIC
                ? $classicContent
                : null,
        ]);
    }

    public function update(UpdatePageRequest $request, Page $page, PageService $service)
    {
        $service->update($page, $request->validated(), (int) auth()->id());

        return redirect()->route('pages.index');
    }

    public function destroy(Page $page, PageService $service)
    {
        $service->delete($page);

        return back();
    }
}
