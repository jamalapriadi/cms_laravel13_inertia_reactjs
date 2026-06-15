<?php

namespace App\Services\Dashboard;

use App\Models\Dashboard\Option;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class OptionService
{
    public function paginate(int $perPage = 10)
    {
        return Option::latest()->paginate($perPage);
    }

    public function store(array $data): void
    {
        DB::transaction(function () use ($data) {

            foreach ($data as $key => $value) {

                // normalize boolean
                if (is_bool($value)) {
                    $value = $value ? '1' : '0';
                }

                // jika array → json encode
                if (is_array($value)) {
                    $value = json_encode($value);
                }

                $option = Option::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value]
                );

                Cache::forget("option_{$key}");
            }

        });
    }

    public function update(int $id, array $data): Option
    {
        $option = Option::findOrFail($id);
        $option->update($data);

        $this->clearCacheIfAutoload($option);

        return $option;
    }

    public function delete(int $id): bool
    {
        $option = Option::findOrFail($id);
        $this->clearCacheIfAutoload($option);

        return $option->delete();
    }

    public function get(string $key, $default = null)
    {
        try {
            if (! Schema::hasTable('options')) {
                return $default;
            }

            return Cache::rememberForever("option_{$key}", function () use ($key, $default) {
                return Option::where('key', $key)->value('value') ?? $default;
            });
        } catch (Throwable) {
            return $default;
        }
    }

    protected function clearCacheIfAutoload(Option $option): void
    {
        if ($option->autoload) {
            Cache::forget("option_{$option->key}");
        }
    }
}
