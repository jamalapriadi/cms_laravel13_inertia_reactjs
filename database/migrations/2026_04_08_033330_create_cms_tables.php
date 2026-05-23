<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('content')->nullable();
            $table->string('type')->default('post');
            $table->string('status')->default('publish');
            $table->foreignId('parent_id')->nullable()->constrained('posts')->onDelete('cascade');
            $table->string('mime_type')->nullable();
            $table->boolean('comment_status')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('post_meta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->onDelete('cascade');
            $table->string('meta_key');
            $table->longText('meta_value')->nullable();
            $table->timestamps();
        });

        Schema::create('terms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('term_taxonomy', function (Blueprint $table) {
            $table->id();
            $table->foreignId('term_id')->constrained()->onDelete('cascade');
            $table->string('taxonomy');
            $table->text('description')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('term_taxonomy')->onDelete('cascade');
            $table->unsignedInteger('count')->default(0);
            $table->timestamps();
        });

        Schema::create('term_relationships', function (Blueprint $table) {
            $table->foreignId('post_id')->constrained()->onDelete('cascade');
            $table->foreignId('term_taxonomy_id')->constrained('term_taxonomy')->onDelete('cascade');
            $table->primary(['post_id', 'term_taxonomy_id']);
            $table->timestamps();
        });

        Schema::create('post_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable();
            $table->string('category_name', 191)->nullable();
            $table->string('slug', 191)->nullable();
            $table->longText('description')->nullable();
            $table->uuid('parent_id')->nullable();
            $table->string('featured_image')->nullable();
            $table->timestamps();

            $table->foreign('parent_id')
                ->references('id')
                ->on('post_categories')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_categories');
        Schema::dropIfExists('term_relationships');
        Schema::dropIfExists('term_taxonomy');
        Schema::dropIfExists('terms');
        Schema::dropIfExists('post_meta');
        Schema::dropIfExists('posts');
    }
};
