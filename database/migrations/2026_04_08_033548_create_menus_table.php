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
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Main Menu, Footer Menu
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained()->cascadeOnDelete();

            $table->foreignId('parent_id')->nullable()->constrained('menu_items')->cascadeOnDelete();

            $table->string('url')->nullable(); // custom URL

            $table->string('type')->default('custom'); 
            // custom | page | category

            $table->unsignedInteger('order')->default(0);

            $table->string('target')->default('_self'); // _blank, _self

            $table->string('icon')->nullable();

            $table->json('meta')->nullable(); // extensible

            $table->timestamps();
        });

        Schema::create('menu_item_translations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('menu_item_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('locale', 10); // id, en, dll

            $table->string('title');
            $table->string('url')->nullable(); // optional override URL

            $table->timestamps();

            // 🔥 unique constraint (1 bahasa per item)
            $table->unique(['menu_item_id', 'locale']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menus');
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('menu_item_translations');
    }
};
