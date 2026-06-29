<?php

namespace App\Console\Commands;

use App\Models\Page;
use App\Models\Post;
use App\Services\PostService;
use Illuminate\Console\Command;

class DraftsCleanupCommand extends Command
{
    protected $signature = 'drafts:cleanup';

    protected $description = 'Clean up old empty auto-drafts and abandoned drafts';

    public function __construct(
        private readonly PostService $postService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Cleaning up empty and old auto-drafts...');

        // 1. Delete empty auto-drafts older than 24 hours
        // Empty post draft check: title is 'Auto Draft' or empty, excerpt is empty, content is empty or '[]'
        $emptyPosts = Post::where('status', 'auto-draft')
            ->where('updated_at', '<', now()->subHours(24))
            ->where(function ($query) {
                $query->where('title', 'Auto Draft')
                    ->orWhereNull('title')
                    ->orWhere('title', '');
            })
            ->where(function ($query) {
                $query->whereNull('excerpt')
                    ->orWhere('excerpt', '');
            })
            ->where(function ($query) {
                $query->whereNull('content')
                    ->orWhere('content', '[]')
                    ->orWhere('content', '')
                    ->orWhere('content', '""');
            })
            ->get();

        $emptyPostsCount = 0;
        foreach ($emptyPosts as $post) {
            $this->postService->forceDelete($post);
            $emptyPostsCount++;
        }

        // Empty page draft check
        $emptyPages = Page::where('status', 'auto-draft')
            ->where('updated_at', '<', now()->subHours(24))
            ->where(function ($query) {
                $query->where('title', 'Auto Draft')
                    ->orWhereNull('title')
                    ->orWhere('title', '');
            })
            ->where(function ($query) {
                $query->whereNull('excerpt')
                    ->orWhere('excerpt', '');
            })
            ->where(function ($query) {
                $query->whereNull('content')
                    ->orWhere('content', '[]')
                    ->orWhere('content', '')
                    ->orWhere('content', '""');
            })
            ->get();

        $emptyPagesCount = 0;
        foreach ($emptyPages as $page) {
            $page->forceDelete();
            $emptyPagesCount++;
        }

        // 2. Delete all auto-drafts older than 7 days (abandoned)
        $abandonedPosts = Post::where('status', 'auto-draft')
            ->where('updated_at', '<', now()->subDays(7))
            ->get();

        $abandonedPostsCount = 0;
        foreach ($abandonedPosts as $post) {
            $this->postService->forceDelete($post);
            $abandonedPostsCount++;
        }

        $abandonedPages = Page::where('status', 'auto-draft')
            ->where('updated_at', '<', now()->subDays(7))
            ->get();

        $abandonedPagesCount = 0;
        foreach ($abandonedPages as $page) {
            $page->forceDelete();
            $abandonedPagesCount++;
        }

        $this->info("Cleanup complete. Deleted {$emptyPostsCount} empty post drafts, {$emptyPagesCount} empty page drafts, {$abandonedPostsCount} abandoned post drafts, and {$abandonedPagesCount} abandoned page drafts.");

        return self::SUCCESS;
    }
}
