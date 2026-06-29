<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\AutoSavePageRequest;
use App\Models\Page;
use App\Services\PageService;
use Illuminate\Http\JsonResponse;

class PageAutoSaveController extends Controller
{
    public function store(AutoSavePageRequest $request, PageService $service): JsonResponse
    {
        $data = $request->validated();
        $data['title'] = $data['title'] ?? 'Auto Draft';
        $data['status'] = 'auto-draft';

        $page = $service->create($data, (int) auth()->id());

        return response()->json([
            'id' => $page->id,
            'status' => $page->status,
            'updated_at' => $page->updated_at->toIso8601String(),
            'message' => 'Page draft auto-saved successfully.',
        ]);
    }

    public function update(AutoSavePageRequest $request, Page $page, PageService $service): JsonResponse
    {
        abort_unless($page->created_by === (int) auth()->id(), 403);

        if (! in_array($page->status, ['draft', 'auto-draft'], true)) {
            abort(400, 'Cannot autosave a published or archived page.');
        }

        $data = $request->validated();
        $data['title'] = $data['title'] ?? $page->title;
        $data['status'] = in_array($page->status, ['draft', 'auto-draft'], true) ? $page->status : 'auto-draft';

        $service->update($page, $data, (int) auth()->id());

        return response()->json([
            'id' => $page->id,
            'status' => $page->status,
            'updated_at' => $page->updated_at->toIso8601String(),
            'message' => 'Page draft auto-saved successfully.',
        ]);
    }
}
