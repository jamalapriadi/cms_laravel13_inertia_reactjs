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
        Schema::create('templates', function(Blueprint $table){
            $table->uuid('id')->primary();
            $table->string('name',50)->nullable();
            $table->text('description')->nullable();
            $table->string('template_preview',191)->nullable();
            $table->string('path_template',191)->nullable();
            $table->enum('default',['Y','N'])->default('N');
            $table->enum('custom_template',['Y','N'])->default('Y');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('templates');
    }
};
