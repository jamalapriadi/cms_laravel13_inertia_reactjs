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
        Schema::table('kabupatens', function (Blueprint $table) {
            $indexes = Schema::getIndexes('kabupatens');
            $hasIndex = collect($indexes)->contains('name', 'kabupatens_province_id_index');
            if (! $hasIndex) {
                $table->index('province_id');
            }
        });

        Schema::table('kecamatans', function (Blueprint $table) {
            $indexes = Schema::getIndexes('kecamatans');
            $hasIndex = collect($indexes)->contains('name', 'kecamatans_kabupaten_id_index');
            if (! $hasIndex) {
                $table->index('kabupaten_id');
            }
        });

        Schema::table('kelurahans', function (Blueprint $table) {
            $indexes = Schema::getIndexes('kelurahans');
            $hasIndex = collect($indexes)->contains('name', 'kelurahans_kecamatan_id_index');
            if (! $hasIndex) {
                $table->index('kecamatan_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kabupatens', function (Blueprint $table) {
            $indexes = Schema::getIndexes('kabupatens');
            $hasIndex = collect($indexes)->contains('name', 'kabupatens_province_id_index');
            if ($hasIndex) {
                $table->dropIndex('kabupatens_province_id_index');
            }
        });

        Schema::table('kecamatans', function (Blueprint $table) {
            $indexes = Schema::getIndexes('kecamatans');
            $hasIndex = collect($indexes)->contains('name', 'kecamatans_kabupaten_id_index');
            if ($hasIndex) {
                $table->dropIndex('kecamatans_kabupaten_id_index');
            }
        });

        Schema::table('kelurahans', function (Blueprint $table) {
            $indexes = Schema::getIndexes('kelurahans');
            $hasIndex = collect($indexes)->contains('name', 'kelurahans_kecamatan_id_index');
            if ($hasIndex) {
                $table->dropIndex('kelurahans_kecamatan_id_index');
            }
        });
    }
};
