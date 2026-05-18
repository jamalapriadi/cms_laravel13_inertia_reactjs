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
        Schema::create('blocks', function (Blueprint $table) {
            $table->id();

            // Relasi ke post
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();

            // Nested system (tree)
            $table->foreignId('parent_id')->nullable()->constrained('blocks')->cascadeOnDelete();

            // Type block (heading, image, container, dll)
            $table->string('type');

            // Props (text, src, dll)
            $table->json('props')->nullable();

            // Styling (optional, tapi recommended)
            $table->json('styles')->nullable();

            // Order untuk drag & drop
            $table->integer('order')->default(0);

            $table->timestamps();
        });

        Schema::create('block_translations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('block_id')->constrained()->cascadeOnDelete();
            $table->foreignId('language_id')->constrained()->cascadeOnDelete();

            $table->json('props')->nullable();

            $table->unique(['block_id', 'language_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blocks');
        Schema::dropIfExists('block_translations');
    }
};
