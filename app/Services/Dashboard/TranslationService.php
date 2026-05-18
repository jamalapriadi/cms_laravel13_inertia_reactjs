<?php 

namespace App\Services\Dashboard;

use App\Models\Translation;

class TranslationService
{
    public function getPaginated(array $filters = [])
    {
        return Translation::query()
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->where('key', 'like', "%{$search}%")
                  ->orWhere('value', 'like', "%{$search}%");
            })
            ->when($filters['locale'] ?? null, function ($q, $locale) {
                $q->where('locale', $locale);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    public function store(array $data)
    {
        $translation = Translation::updateOrCreate(
            [
                'key' => $data['key'],
                'locale' => $data['locale'],
            ],
            [
                'value' => $data['value'],
            ]
        );

        cache()->flush();

        return $translation;
    }

    public function delete(int $id)
    {
        $translation = Translation::findOrFail($id);
        $translation->delete();

        cache()->flush();
    }
}