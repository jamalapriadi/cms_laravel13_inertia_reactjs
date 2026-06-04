<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Throwable;

class StorageHealthCheckCommand extends Command
{
    protected $signature = 'storage:health-check {--fix : Attempt safe automatic fixes}';

    protected $description = 'Check Laravel public storage health, permissions, symlink, hidden files, and filesystem metadata access';

    /**
     * @var list<array{status:string, label:string, detail:string|null, core:bool}>
     */
    private array $results = [];

    private int $failures = 0;

    public function handle(): int
    {
        if ($this->option('fix')) {
            $this->runFixes();
            $this->newLine();
        }

        $this->info('Laravel Storage Health Check');
        $this->line('Project: '.base_path());
        $this->line('Environment: '.app()->environment());
        $this->newLine();

        $this->runChecks();
        $this->renderResults();

        if ($this->failures > 0) {
            $this->newLine();
            $this->warn('Manual VPS permission commands:');
            $this->line('sudo chown -R www-data:www-data storage bootstrap/cache');
            $this->line('sudo find storage bootstrap/cache -type d -exec chmod 775 {} \;');
            $this->line('sudo find storage bootstrap/cache -type f -exec chmod 664 {} \;');

            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    private function runFixes(): void
    {
        $this->info('Running safe storage fixes...');

        foreach ($this->requiredDirectories() as $directory) {
            if (! File::isDirectory($directory)) {
                File::makeDirectory($directory, 0775, true);
                $this->line('Created: '.$directory);
            }
        }

        foreach ($this->safeHiddenFiles() as $file) {
            if (File::isFile($file)) {
                File::delete($file);
                $this->line('Removed hidden file: '.$file);
            }
        }

        $link = public_path('storage');
        $target = storage_path('app/public');

        if (is_link($link) && realpath($link) !== realpath($target)) {
            unlink($link);
            $this->line('Removed invalid public/storage symlink.');
        }

        if (! is_link($link)) {
            if (File::exists($link)) {
                $this->warn('public/storage exists but is not a symlink. Remove or move it manually before running storage:link.');
            } else {
                try {
                    Artisan::call('storage:link');
                    $this->line(trim(Artisan::output()));
                } catch (Throwable $exception) {
                    $this->warning('storage:link failed during --fix', $exception->getMessage());
                }
            }
        }

        try {
            Artisan::call('optimize:clear');
            $this->line(trim(Artisan::output()));
        } catch (Throwable $exception) {
            $this->warning('optimize:clear failed during --fix', $exception->getMessage());
        }
    }

    private function runChecks(): void
    {
        $publicRoot = (string) config('filesystems.disks.public.root');
        $expectedPublicRoot = storage_path('app/public');
        $publicLink = public_path('storage');
        $healthFile = 'health-check.txt';

        $this->pass('Project path', base_path());
        $this->check($publicRoot !== '', 'Public disk root configured', $publicRoot ?: 'filesystems.disks.public.root is empty');
        $this->check(realpath($publicRoot) === realpath($expectedPublicRoot), 'Public disk root points to storage/app/public', $publicRoot);
        $this->check(File::isDirectory($expectedPublicRoot), 'storage/app/public exists', $expectedPublicRoot);
        $this->check(File::isWritable($expectedPublicRoot), 'storage/app/public writable', $expectedPublicRoot);
        $this->check(File::isWritable(storage_path()), 'storage writable', storage_path());
        $this->check(File::isWritable(base_path('bootstrap/cache')), 'bootstrap/cache writable', base_path('bootstrap/cache'));
        $this->check(is_link($publicLink), 'public/storage is symlink', $publicLink);
        $this->check(
            is_link($publicLink) && realpath($publicLink) === realpath($expectedPublicRoot),
            'public/storage points to storage/app/public',
            $publicLink.' -> '.(is_link($publicLink) ? (readlink($publicLink) ?: 'unknown') : 'not a symlink')
        );

        $hiddenFiles = $this->hiddenFiles($expectedPublicRoot);

        if ($hiddenFiles === []) {
            $this->pass('No hidden files in storage/app/public');
        } else {
            $this->warning('Hidden files found in storage/app/public', implode(', ', array_map('basename', $hiddenFiles)));
        }

        $writeOk = false;

        try {
            $writeOk = Storage::disk('public')->put($healthFile, 'ok');
            $this->check($writeOk, 'Storage::disk(public)->put health-check.txt', $healthFile);
        } catch (Throwable $exception) {
            $this->recordFail('Storage::disk(public)->put health-check.txt', $exception->getMessage());
        }

        if ($writeOk) {
            try {
                $this->check(Storage::disk('public')->get($healthFile) === 'ok', 'Read back health-check.txt', $healthFile);
            } catch (Throwable $exception) {
                $this->recordFail('Read back health-check.txt', $exception->getMessage());
            }

            try {
                $mimeType = Storage::disk('public')->mimeType($healthFile);
                $this->check(is_string($mimeType) && $mimeType !== '', 'Read mimeType for valid file', $mimeType ?: 'empty mime type');
            } catch (Throwable $exception) {
                $this->recordFail('Read mimeType for valid file', $exception->getMessage());
            }
        }
    }

    private function renderResults(): void
    {
        $labelWidth = max(array_map(fn (array $result) => strlen($result['label']), $this->results));

        foreach ($this->results as $result) {
            $status = match ($result['status']) {
                'PASS' => '<fg=green>PASS</>',
                'WARNING' => '<fg=yellow>WARNING</>',
                default => '<fg=red>FAIL</>',
            };

            $line = sprintf('%s  %-'.$labelWidth.'s', $status, $result['label']);

            if ($result['detail']) {
                $line .= '  '.$result['detail'];
            }

            $this->line($line);
        }
    }

    /**
     * @return list<string>
     */
    private function requiredDirectories(): array
    {
        return [
            storage_path('app/public'),
            storage_path('framework/cache'),
            storage_path('framework/sessions'),
            storage_path('framework/views'),
            base_path('bootstrap/cache'),
        ];
    }

    /**
     * @return list<string>
     */
    private function safeHiddenFiles(): array
    {
        return [
            storage_path('app/public/.gitignore'),
            storage_path('app/public/.DS_Store'),
        ];
    }

    /**
     * @return list<string>
     */
    private function hiddenFiles(string $root): array
    {
        if (! File::isDirectory($root)) {
            return [];
        }

        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $fileInfo) {
            if ($fileInfo->isFile() && str_starts_with($fileInfo->getBasename(), '.')) {
                $files[] = $fileInfo->getPathname();
            }
        }

        sort($files);

        return $files;
    }

    private function check(bool $condition, string $label, ?string $detail = null, bool $core = true): void
    {
        if ($condition) {
            $this->pass($label, $detail, $core);

            return;
        }

        $this->recordFail($label, $detail, $core);
    }

    private function pass(string $label, ?string $detail = null, bool $core = true): void
    {
        $this->results[] = [
            'status' => 'PASS',
            'label' => $label,
            'detail' => $detail,
            'core' => $core,
        ];
    }

    private function warning(string $label, ?string $detail = null, bool $core = false): void
    {
        $this->results[] = [
            'status' => 'WARNING',
            'label' => $label,
            'detail' => $detail,
            'core' => $core,
        ];
    }

    private function recordFail(string $label, ?string $detail = null, bool $core = true): void
    {
        $this->results[] = [
            'status' => 'FAIL',
            'label' => $label,
            'detail' => $detail,
            'core' => $core,
        ];

        if ($core) {
            $this->failures++;
        }
    }
}
