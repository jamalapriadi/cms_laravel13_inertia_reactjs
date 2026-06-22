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
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'wp_id')) {
                $table->unsignedBigInteger('wp_id')->nullable()->index()->after('id');
            }
            if (! Schema::hasColumn('products', 'thumbnail_url')) {
                $table->string('thumbnail_url')->nullable()->after('thumbnail');
            }
            if (! Schema::hasColumn('products', 'thumbnail_mime_type')) {
                $table->string('thumbnail_mime_type')->nullable()->after('thumbnail_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'wp_id')) {
                $table->dropColumn('wp_id');
            }
            if (Schema::hasColumn('products', 'thumbnail_url')) {
                $table->dropColumn('thumbnail_url');
            }
            if (Schema::hasColumn('products', 'thumbnail_mime_type')) {
                $table->dropColumn('thumbnail_mime_type');
            }
        });
    }
};
