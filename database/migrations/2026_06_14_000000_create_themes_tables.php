<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('themes', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('version')->nullable();
            $table->string('author')->nullable();
            $table->text('description')->nullable();
            $table->string('namespace')->nullable();
            $table->string('provider')->nullable();
            $table->string('path');
            $table->string('screenshot')->nullable();
            $table->json('manifest')->nullable();
            $table->boolean('is_installed')->default(true);
            $table->boolean('is_active')->default(false);
            $table->timestamps();

            $table->index(['is_active', 'is_installed']);
        });

        Schema::create('theme_settings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('theme_id')->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->json('value')->nullable();
            $table->timestamps();

            $table->unique(['theme_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('theme_settings');
        Schema::dropIfExists('themes');
    }
};
