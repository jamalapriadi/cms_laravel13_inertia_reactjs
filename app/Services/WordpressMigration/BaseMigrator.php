<?php

namespace App\Services\WordpressMigration;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

abstract class BaseMigrator
{
    protected bool $dryRun = false;

    protected ?int $limit = null;

    protected ?int $defaultAdminId = null;

    public function setDryRun(bool $dryRun): self
    {
        $this->dryRun = $dryRun;

        return $this;
    }

    public function setLimit(?int $limit): self
    {
        $this->limit = $limit;

        return $this;
    }

    abstract public function migrate(array &$report): void;

    abstract public function rollback(array &$report): void;

    /**
     * Get the prefix-qualified WordPress table name.
     */
    protected function wpTable(string $table): string
    {
        return $table;
    }

    /**
     * Get target Laravel ID mapped to a WordPress ID.
     */
    protected function getMappedId(int $wpId, string $wpType): ?string
    {
        return DB::table('wordpress_migration_maps')
            ->where('wordpress_id', $wpId)
            ->where('wordpress_type', $wpType)
            ->value('laravel_id');
    }

    /**
     * Store mapping between WordPress ID and Laravel ID.
     */
    protected function recordMapping(int $wpId, string $wpType, string $laravelTable, string $laravelId): void
    {
        if ($this->dryRun) {
            return;
        }

        $exists = DB::table('wordpress_migration_maps')
            ->where('wordpress_id', $wpId)
            ->where('wordpress_type', $wpType)
            ->exists();

        if ($exists) {
            DB::table('wordpress_migration_maps')
                ->where('wordpress_id', $wpId)
                ->where('wordpress_type', $wpType)
                ->update([
                    'laravel_table' => $laravelTable,
                    'laravel_id' => $laravelId,
                    'updated_at' => now(),
                ]);
        } else {
            DB::table('wordpress_migration_maps')->insert([
                'wordpress_id' => $wpId,
                'wordpress_type' => $wpType,
                'laravel_table' => $laravelTable,
                'laravel_id' => $laravelId,
                'migrated_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Check if a mapping exists.
     */
    protected function isMapped(int $wpId, string $wpType): bool
    {
        return DB::table('wordpress_migration_maps')
            ->where('wordpress_id', $wpId)
            ->where('wordpress_type', $wpType)
            ->exists();
    }

    /**
     * Clean mapping records for rollback/fresh options.
     */
    protected function deleteMappingsForType(string $wpType): array
    {
        $mappings = DB::table('wordpress_migration_maps')
            ->where('wordpress_type', $wpType)
            ->get();

        $laravelIds = $mappings->pluck('laravel_id')->all();

        if (! $this->dryRun) {
            DB::table('wordpress_migration_maps')
                ->where('wordpress_type', $wpType)
                ->delete();
        }

        return $laravelIds;
    }

    /**
     * Map WordPress user to local user_id.
     */
    protected function resolveAuthorId(int $wpAuthorId): int
    {
        if ($this->defaultAdminId !== null) {
            return $this->defaultAdminId;
        }

        // 1. Try to find the default admin in local system
        $defaultUser = User::query()->orderBy('id')->first();
        $this->defaultAdminId = $defaultUser ? $defaultUser->id : 1;

        // 2. Fetch WordPress user email/login
        try {
            $wpUser = DB::connection('wordpress')
                ->table('users')
                ->where('ID', $wpAuthorId)
                ->first();

            if ($wpUser) {
                $localUser = User::query()
                    ->where('email', $wpUser->user_email)
                    ->orWhere('email', $wpUser->user_login)
                    ->first();

                if ($localUser) {
                    return $localUser->id;
                }
            }
        } catch (\Throwable $e) {
            // connection failed or table does not exist
        }

        return $this->defaultAdminId;
    }

    /**
     * Resolve a unique slug for Laravel table to prevent key collision.
     */
    protected function resolveUniqueSlug(string $table, string $slug, ?string $excludeId = null, string $idColumn = 'id'): string
    {
        $original = $slug = Str::slug($slug);
        $count = 1;

        while (true) {
            $query = DB::table($table)->where('slug', $slug);
            if ($excludeId !== null) {
                $query->where($idColumn, '!=', $excludeId);
            }

            if (! $query->exists()) {
                return $slug;
            }

            $slug = $original.'-'.$count;
            $count++;
        }
    }
}
