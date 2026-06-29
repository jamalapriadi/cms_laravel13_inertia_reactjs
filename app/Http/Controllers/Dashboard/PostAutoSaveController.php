<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\AutoSavePostRequest;
use App\Models\Post;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;

class PostAutoSaveController extends Controller
{
    public function store(AutoSavePostRequest $request, PostService $service): JsonResponse
    {
        $data = $request->validated();
        $data['title'] = $data['title'] ?? 'Auto Draft';
        $data['status'] = 'auto-draft';

        // PostService expects content field. If blocks is provided, rename it to content.
        if (isset($data['blocks']) && ! isset($data['content'])) {
            $data['content'] = $data['blocks'];
        }

        $post = $service->create($data, (int) auth()->id());

        return response()->json([
            'id' => $post->id,
            'status' => $post->status,
            'updated_at' => $post->updated_at->toIso8601String(),
            'message' => 'Post draft auto-saved successfully.',
        ]);
    }

    public function update(AutoSavePostRequest $request, Post $post, PostService $service): JsonResponse
    {
        abort_unless($post->user_id === (int) auth()->id(), 403);

        if (! in_array($post->status, ['draft', 'auto-draft'], true)) {
            abort(400, 'Cannot autosave a published or scheduled post.');
        }

        $data = $request->validated();
        $data['title'] = $data['title'] ?? $post->title;
        $data['status'] = in_array($post->status, ['draft', 'auto-draft'], true) ? $post->status : 'auto-draft';

        // PostService expects blocks field on update, or we can use content/blocks.
        // Let's pass content/blocks.
        if (isset($data['content']) && ! isset($data['blocks'])) {
            $data['blocks'] = $data['content'];
        }

        $service->update($post, $data);

        return response()->json([
            'id' => $post->id,
            'status' => $post->status,
            'updated_at' => $post->updated_at->toIso8601String(),
            'message' => 'Post draft auto-saved successfully.',
        ]);
    }
}
