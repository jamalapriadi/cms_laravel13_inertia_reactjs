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
        Schema::table('posts', function (Blueprint $table) {
            if (! Schema::hasColumn('posts', 'wp_id')) {
                $table->unsignedBigInteger('wp_id')->nullable()->index()->after('id');
            }
            if (! Schema::hasColumn('posts', 'featured_image')) {
                $table->string('featured_image')->nullable()->after('excerpt');
            }
            if (! Schema::hasColumn('posts', 'featured_image_url')) {
                $table->string('featured_image_url')->nullable()->after('featured_image');
            }
            if (! Schema::hasColumn('posts', 'featured_image_mime_type')) {
                $table->string('featured_image_mime_type')->nullable()->after('featured_image_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            if (Schema::hasColumn('posts', 'wp_id')) {
                $table->dropColumn('wp_id');
            }
            if (Schema::hasColumn('posts', 'featured_image')) {
                $table->dropColumn('featured_image');
            }
            if (Schema::hasColumn('posts', 'featured_image_url')) {
                $table->dropColumn('featured_image_url');
            }
            if (Schema::hasColumn('posts', 'featured_image_mime_type')) {
                $table->dropColumn('featured_image_mime_type');
            }
        });
    }
};
