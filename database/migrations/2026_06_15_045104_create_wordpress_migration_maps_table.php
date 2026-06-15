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
        Schema::create('wordpress_migration_maps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('wordpress_id');
            $table->string('wordpress_type');
            $table->string('laravel_table');
            $table->string('laravel_id'); // String to support both bigInt and UUID ids
            $table->timestamp('migrated_at')->useCurrent();
            $table->timestamps();

            $table->unique(['wordpress_id', 'wordpress_type'], 'wp_mig_maps_wp_id_type_unique');
            $table->index(['laravel_table', 'laravel_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wordpress_migration_maps');
    }
};
