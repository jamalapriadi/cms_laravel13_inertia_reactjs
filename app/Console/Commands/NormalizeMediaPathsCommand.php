<?php

namespace App\Console\Commands;

use App\Support\MediaPath;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class NormalizeMediaPathsCommand extends Command
{
    protected $signature = 'media:normalize-paths {--dry-run : Show changes without updating the database}';

    protected $description = 'Normalize stored public media URLs into relative public disk paths';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $changes = 0;

        foreach ($this->targets() as $target) {
            [$table, $columns] = $target;

            if (! Schema::hasTable($table)) {
                continue;
            }

            $columns = array_values(array_filter(
                $columns,
                fn (string $column) => Schema::hasColumn($table, $column)
            ));

            if ($columns === []) {
                continue;
            }

            DB::table($table)
                ->select(['id', ...$columns])
                ->where(function ($query) use ($columns) {
                    foreach ($columns as $column) {
                        $query->orWhereNotNull($column);
                    }
                })
                ->orderBy('id')
                ->chunk(200, function ($rows) use ($table, $columns, $dryRun, &$changes) {
                    foreach ($rows as $row) {
                        $updates = [];

                        foreach ($columns as $column) {
                            $current = $row->{$column};

                            if (! is_string($current) || trim($current) === '') {
                                continue;
                            }

                            if (! $this->shouldNormalize($current)) {
                                continue;
                            }

                            $normalized = MediaPath::normalize($current, requireExists: false);

                            if (! $normalized || $normalized === $current) {
                                continue;
                            }

                            $updates[$column] = $normalized;
                            $this->line("{$table}#{$row->id}.{$column}: {$current} -> {$normalized}");
                        }

                        if ($updates === []) {
                            continue;
                        }

                        $changes += count($updates);

                        if (! $dryRun) {
                            DB::table($table)->where('id', $row->id)->update($updates);
                        }
                    }
                });
        }

        $this->info(
            $dryRun
                ? "Dry run complete. {$changes} value(s) would be normalized."
                : "Normalization complete. {$changes} value(s) normalized."
        );

        return self::SUCCESS;
    }

    /**
     * @return list<array{0:string, 1:list<string>}>
     */
    private function targets(): array
    {
        return [
            ['media', ['path']],
            ['brands', ['logo']],
            ['categories', ['image']],
            ['products', ['thumbnail']],
            ['product_images', ['image']],
            ['variant_items', ['image']],
            ['product_collections', ['banner_image']],
            ['banner_slides', ['image', 'mobile_image']],
            ['post_categories', ['featured_image']],
            ['post_meta', ['meta_value']],
            ['site_content_translations', ['value']],
            ['options', ['value']],
        ];
    }

    private function shouldNormalize(string $value): bool
    {
        $value = trim($value);

        if (Str::startsWith($value, ['/storage/', 'storage/'])) {
            return true;
        }

        return filter_var($value, FILTER_VALIDATE_URL) !== false;
    }
}
