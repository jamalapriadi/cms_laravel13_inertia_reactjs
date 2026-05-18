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
        Schema::create('media', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable();

            $table->string('model_type')->nullable();
            $table->uuid('model_id')->nullable();

            $table->uuid('uuid')->nullable()->unique();

            $table->string('collection_name')->nullable();
            $table->string('name')->nullable();
            $table->string('file_name')->nullable();
            $table->string('mime_type')->nullable();

            $table->double('width')->nullable();
            $table->double('height')->nullable();
            $table->string('orientation')->nullable();

            $table->string('path')->nullable();
            $table->string('disk')->default('public');

            $table->unsignedBigInteger('size')->nullable();

            $table->string('alt')->nullable(); // tambahan seperti WordPress

            $table->json('custom_properties')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
