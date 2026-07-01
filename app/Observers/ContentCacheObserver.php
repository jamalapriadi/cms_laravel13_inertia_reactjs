<?php

namespace App\Observers;

use App\Models\ContentEntry;
use App\Models\ContentType;
use App\Services\Cache\ContentCacheService;
use Illuminate\Database\Eloquent\Model;

class ContentCacheObserver
{
    public function __construct(
        private readonly ContentCacheService $cacheService
    ) {}

    public function saved(Model $model): void
    {
        $this->clearFor($model);
    }

    public function deleted(Model $model): void
    {
        $this->clearFor($model);
    }

    public function restored(Model $model): void
    {
        $this->clearFor($model);
    }

    public function forceDeleted(Model $model): void
    {
        $this->clearFor($model);
    }

    private function clearFor(Model $model): void
    {
        // 1. Clear general content-types list cache
        $this->cacheService->clearBySlug('content-types');

        // 2. Determine and clear specific content type slug cache
        $slug = $this->resolveSlug($model);
        if ($slug) {
            $this->cacheService->clearBySlug($slug);
        } else {
            // Fallback: clear all if we cannot resolve specific slug
            $this->cacheService->clearAll();
        }
    }

    private function resolveSlug(Model $model): ?string
    {
        if (method_exists($model, 'contentType') && $model->contentType) {
            return $model->contentType->slug;
        }

        if (isset($model->content_type_id)) {
            $contentTypeClass = class_exists(ContentType::class)
                ? ContentType::class
                : \Jamalapriadi\DynamicContentBuilder\Models\ContentType::class;
            $contentType = $contentTypeClass::find($model->content_type_id);
            if ($contentType) {
                return $contentType->slug;
            }
        }

        if (isset($model->content_entry_id)) {
            $entryClass = class_exists(ContentEntry::class)
                ? ContentEntry::class
                : \Jamalapriadi\DynamicContentBuilder\Models\ContentEntry::class;
            $entry = $entryClass::find($model->content_entry_id);
            if ($entry) {
                return $this->resolveSlug($entry);
            }
        }

        if (isset($model->slug) && (
            $model instanceof ContentType ||
            $model instanceof \Jamalapriadi\DynamicContentBuilder\Models\ContentType
        )) {
            return $model->slug;
        }

        return null;
    }
}
