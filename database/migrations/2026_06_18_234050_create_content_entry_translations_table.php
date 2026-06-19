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
        Schema::create('content_entry_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('content_entry_id')->constrained('content_entries')->cascadeOnDelete();
            $table->foreignId('language_id')->constrained('languages')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->text('excerpt')->nullable();
            $table->string('status', 20)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();

            $table->unique(['content_entry_id', 'language_id'], 'content_entry_trans_entry_lang_unique');
            $table->unique(['language_id', 'slug'], 'content_entry_trans_lang_slug_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_entry_translations');
    }
};
