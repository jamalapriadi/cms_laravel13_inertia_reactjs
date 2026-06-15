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
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('code', 7)->unique();
            $table->string('english_name')->nullable();
            $table->tinyInteger('major')->nullable()->default(0);
            $table->tinyInteger('active')->nullable();
            $table->string('default_locale', 35)->nullable();
            $table->string('tag', 35)->nullable();
            $table->tinyInteger('encode_url')->nullable()->default(0);
            $table->string('country')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('languages');
    }
};
