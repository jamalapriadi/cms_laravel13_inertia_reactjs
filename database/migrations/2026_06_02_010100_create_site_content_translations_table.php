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
        Schema::create('site_content_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('site_content_id')->constrained('site_contents')->cascadeOnDelete();
            $table->string('locale', 10);
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['site_content_id', 'locale']);
            $table->index('locale');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_content_translations');
    }
};
