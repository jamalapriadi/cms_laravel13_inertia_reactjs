<?php

// app/Services/PostCategoryService.php

namespace App\Services;

use App\Models\PostCategory;
use App\Support\MediaPath;

class PostCategoryService
{
    public function getPaginated($filters)
    {
        return PostCategory::with('parent')
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->where('category_name', 'like', "%{$search}%");
            })
            ->when($filters['parent_id'] ?? null, function ($q, $parentId) {
                $q->where('parent_id', $parentId);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    public function create($data)
    {
        unset($data['slug']);
        $data['user_id'] = auth()->id();

        if (array_key_exists('featured_image', $data)) {
            $data['featured_image'] = MediaPath::normalize($data['featured_image'], requireExists: false);
        }

        return PostCategory::create($data);
    }

    public function update(PostCategory $category, $data)
    {
        if (array_key_exists('featured_image', $data)) {
            $data['featured_image'] = MediaPath::normalize($data['featured_image'], requireExists: false);
        }

        return $category->update($data);
    }

    public function delete(PostCategory $category)
    {
        return $category->delete();
    }
}
