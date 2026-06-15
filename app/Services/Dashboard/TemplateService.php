<?php

// app/Services/TemplateService.php

namespace App\Services\Dashboard;

use App\Models\Dashboard\Template;

class TemplateService
{
    public function paginateWithSearch(?string $search, int $perPage = 10)
    {
        return Template::query()
            ->when($search, fn ($q) => $q->where('name', 'like', "%$search%")
                ->orWhere('description', 'like', "%$search%")
            )
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function store(array $data): Template
    {
        return Template::create($data);
    }

    public function update(Template $template, array $data): Template
    {
        $template->update($data);

        return $template;
    }

    public function delete(Template $template): void
    {
        $template->delete();
    }
}
