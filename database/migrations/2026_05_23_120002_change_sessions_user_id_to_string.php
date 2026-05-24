<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sessions') || ! Schema::hasColumn('sessions', 'user_id')) {
            return;
        }

        if (DB::connection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('sessions', function ($table) {
            $table->dropIndex(['user_id']);
        });

        DB::statement('ALTER TABLE sessions MODIFY user_id VARCHAR(255) NULL');

        Schema::table('sessions', function ($table) {
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('sessions') || ! Schema::hasColumn('sessions', 'user_id')) {
            return;
        }

        if (DB::connection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('sessions', function ($table) {
            $table->dropIndex(['user_id']);
        });

        DB::statement('ALTER TABLE sessions MODIFY user_id BIGINT UNSIGNED NULL');

        Schema::table('sessions', function ($table) {
            $table->index('user_id');
        });
    }
};
