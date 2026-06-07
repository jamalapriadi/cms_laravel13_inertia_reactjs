<?php

namespace App\Services;

use App\Models\Page;
use App\Services\Cms\BlockTreeService;
use App\Support\MediaPath;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PageService
{
    public function __construct(
        private readonly BlockTreeService $blockTreeService
    ) {}

    public function create(array $data, int $userId): Page
    {
        return DB::transaction(function () use ($data, $userId): Page {
            $blocks = $this->blockTreeService->decode($data['blocks'] ?? $data['content'] ?? null);

            $page = Page::query()->create([
                'title' => $data['title'],
                'slug' => $this->uniqueSlug($data['slug'] ?? null, $data['title']),
                'excerpt' => $data['excerpt'] ?? null,
                'content' => json_encode($blocks),
                'status' => $data['status'],
                'featured_image' => $this->normalizeMedia($data['featured_image'] ?? null),
                'seo_title' => $data['seo_title'] ?? null,
                'seo_description' => $data['seo_description'] ?? null,
                'seo_keywords' => $data['seo_keywords'] ?? null,
                'og_image' => $this->normalizeMedia($data['og_image'] ?? null),
                'published_at' => $this->resolvePublishedAt($data),
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            $this->blockTreeService->syncForPage($page, $blocks);

            return $page;
        });
    }

    public function update(Page $page, array $data, int $userId): Page
    {
        DB::transaction(function () use ($page, $data, $userId): void {
            $blocks = $this->blockTreeService->decode($data['blocks'] ?? $data['content'] ?? null);

            $page->update([
                'title' => $data['title'],
                'slug' => $this->uniqueSlug($data['slug'] ?? null, $data['title'], $page),
                'excerpt' => $data['excerpt'] ?? null,
                'content' => json_encode($blocks),
                'status' => $data['status'],
                'featured_image' => $this->normalizeMedia($data['featured_image'] ?? null),
                'seo_title' => $data['seo_title'] ?? null,
                'seo_description' => $data['seo_description'] ?? null,
                'seo_keywords' => $data['seo_keywords'] ?? null,
                'og_image' => $this->normalizeMedia($data['og_image'] ?? null),
                'published_at' => $this->resolvePublishedAt($data),
                'updated_by' => $userId,
            ]);

            $this->blockTreeService->syncForPage($page, $blocks);
        });

        return $page;
    }

    public function delete(Page $page): bool
    {
        return DB::transaction(fn (): bool => (bool) $page->delete());
    }

    private function resolvePublishedAt(array $data): ?CarbonInterface
    {
        if (! empty($data['published_at'])) {
            return Carbon::parse($data['published_at']);
        }

        return $data['status'] === 'publish' ? now() : null;
    }

    private function uniqueSlug(?string $slug, string $title, ?Page $ignore = null): string
    {
        $base = Str::slug($slug ?: $title) ?: Str::random(8);
        $candidate = $base;
        $suffix = 2;

        while ($this->slugExists($candidate, $ignore)) {
            $candidate = "{$base}-{$suffix}";
            $suffix++;
        }

        return $candidate;
    }

    private function slugExists(string $slug, ?Page $ignore): bool
    {
        return Page::withTrashed()
            ->where('slug', $slug)
            ->when($ignore, fn (Builder $query) => $query->whereKeyNot($ignore->id))
            ->exists();
    }

    private function normalizeMedia(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return MediaPath::normalize($path, requireExists: false) ?? $path;
    }
}
