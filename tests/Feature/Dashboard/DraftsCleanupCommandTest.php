<?php

use App\Models\Page;
use App\Models\Post;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('it cleans up empty auto-drafts older than 24 hours', function () {
    // 1. Post: Empty auto-draft, 25 hours old (should be deleted)
    $emptyPostOld = Post::create([
        'user_id' => $this->user->id,
        'title' => 'Auto Draft',
        'slug' => 'auto-draft-1',
        'content' => '[]',
        'status' => 'auto-draft',
        'type' => 'post',
    ]);
    DB::table('posts')->where('id', $emptyPostOld->id)->update([
        'created_at' => Carbon::now()->subHours(25),
        'updated_at' => Carbon::now()->subHours(25),
    ]);

    // 2. Post: Empty auto-draft, 12 hours old (should be kept)
    $emptyPostRecent = Post::create([
        'user_id' => $this->user->id,
        'title' => 'Auto Draft',
        'slug' => 'auto-draft-2',
        'content' => '[]',
        'status' => 'auto-draft',
        'type' => 'post',
    ]);
    DB::table('posts')->where('id', $emptyPostRecent->id)->update([
        'created_at' => Carbon::now()->subHours(12),
        'updated_at' => Carbon::now()->subHours(12),
    ]);

    // 3. Post: Meaningful auto-draft, 25 hours old (should be kept)
    $meaningfulPostOld = Post::create([
        'user_id' => $this->user->id,
        'title' => 'My Great Idea',
        'slug' => 'my-great-idea',
        'content' => 'Some content',
        'status' => 'auto-draft',
        'type' => 'post',
    ]);
    DB::table('posts')->where('id', $meaningfulPostOld->id)->update([
        'created_at' => Carbon::now()->subHours(25),
        'updated_at' => Carbon::now()->subHours(25),
    ]);

    // 4. Page: Empty auto-draft, 25 hours old (should be deleted)
    $emptyPageOld = Page::create([
        'created_by' => $this->user->id,
        'title' => 'Auto Draft',
        'slug' => 'auto-draft-3',
        'content' => '[]',
        'status' => 'auto-draft',
    ]);
    DB::table('pages')->where('id', $emptyPageOld->id)->update([
        'created_at' => Carbon::now()->subHours(25),
        'updated_at' => Carbon::now()->subHours(25),
    ]);

    $this->artisan('drafts:cleanup')->assertExitCode(0);

    expect(Post::find($emptyPostOld->id))->toBeNull();
    expect(Post::find($emptyPostRecent->id))->not->toBeNull();
    expect(Post::find($meaningfulPostOld->id))->not->toBeNull();
    expect(Page::find($emptyPageOld->id))->toBeNull();
});

test('it cleans up all auto-drafts older than 7 days', function () {
    // 1. Post: Meaningful auto-draft, 8 days old (should be deleted)
    $meaningfulPostVeryOld = Post::create([
        'user_id' => $this->user->id,
        'title' => 'Abandoned Post Idea',
        'slug' => 'abandoned-post-idea',
        'content' => 'Some content',
        'status' => 'auto-draft',
        'type' => 'post',
    ]);
    DB::table('posts')->where('id', $meaningfulPostVeryOld->id)->update([
        'created_at' => Carbon::now()->subDays(8),
        'updated_at' => Carbon::now()->subDays(8),
    ]);

    // 2. Post: Meaningful auto-draft, 6 days old (should be kept)
    $meaningfulPostKept = Post::create([
        'user_id' => $this->user->id,
        'title' => 'Recent Post Idea',
        'slug' => 'recent-post-idea',
        'content' => 'Some content',
        'status' => 'auto-draft',
        'type' => 'post',
    ]);
    DB::table('posts')->where('id', $meaningfulPostKept->id)->update([
        'created_at' => Carbon::now()->subDays(6),
        'updated_at' => Carbon::now()->subDays(6),
    ]);

    $this->artisan('drafts:cleanup')->assertExitCode(0);

    expect(Post::find($meaningfulPostVeryOld->id))->toBeNull();
    expect(Post::find($meaningfulPostKept->id))->not->toBeNull();
});
