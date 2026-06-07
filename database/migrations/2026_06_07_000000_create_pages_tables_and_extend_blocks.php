<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content')->nullable();
            $table->string('status')->default('draft');
            $table->string('featured_image')->nullable();
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            $table->text('seo_keywords')->nullable();
            $table->string('og_image')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'published_at', 'created_at']);
            $table->index('deleted_at');
        });

        Schema::create('page_translations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->text('excerpt')->nullable();
            $table->longText('content')->nullable();
            $table->string('status')->default('draft');
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            $table->text('seo_keywords')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['page_id', 'language_id']);
            $table->unique(['language_id', 'slug']);
            $table->index(['status', 'published_at']);
        });

        Schema::table('blocks', function (Blueprint $table): void {
            $table->dropForeign(['post_id']);
        });

        Schema::table('blocks', function (Blueprint $table): void {
            $table->foreignId('page_id')->nullable()->after('post_id')->constrained()->cascadeOnDelete();
        });

        $this->makePostIdNullable();

        Schema::table('blocks', function (Blueprint $table): void {
            $table->foreign('post_id')->references('id')->on('posts')->cascadeOnDelete();
            $table->index(['page_id', 'parent_id', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('blocks', function (Blueprint $table): void {
            $table->dropForeign(['post_id']);
            $table->dropForeign(['page_id']);
            $table->dropIndex(['page_id', 'parent_id', 'order']);
            $table->dropColumn('page_id');
        });

        $this->makePostIdRequired();

        Schema::table('blocks', function (Blueprint $table): void {
            $table->foreign('post_id')->references('id')->on('posts')->cascadeOnDelete();
        });

        Schema::dropIfExists('page_translations');
        Schema::dropIfExists('pages');
    }

    private function makePostIdNullable(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE blocks MODIFY post_id BIGINT UNSIGNED NULL');

            return;
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE blocks ALTER COLUMN post_id DROP NOT NULL');

            return;
        }

        Schema::table('blocks', function (Blueprint $table): void {
            $table->unsignedBigInteger('post_id')->nullable()->change();
        });
    }

    private function makePostIdRequired(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE blocks MODIFY post_id BIGINT UNSIGNED NOT NULL');

            return;
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE blocks ALTER COLUMN post_id SET NOT NULL');

            return;
        }

        Schema::table('blocks', function (Blueprint $table): void {
            $table->unsignedBigInteger('post_id')->nullable(false)->change();
        });
    }
};
