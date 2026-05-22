<?php

namespace JamstackId\InertiaBlockEditor\Http\Controllers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Routing\Controller;
use JamstackId\InertiaBlockEditor\Http\Requests\SaveBlockTreeRequest;
use JamstackId\InertiaBlockEditor\Services\BlockTreeService;

class BlockTreeController extends Controller
{
    public function store(SaveBlockTreeRequest $request, BlockTreeService $blocks)
    {
        $data = $request->validated();
        $blockable = $this->resolveBlockable($data['blockable_type'], (int) $data['blockable_id']);

        $blocks->sync($blockable, $data['blocks'] ?? []);

        return response()->json([
            'blocks' => $blocks->tree($blockable),
        ]);
    }

    private function resolveBlockable(string $alias, int $id): Model
    {
        $modelClass = config("inertia-block-editor.blockables.{$alias}");

        abort_unless(is_string($modelClass) && is_subclass_of($modelClass, Model::class), 404);

        return $modelClass::query()->findOrFail($id);
    }
}
