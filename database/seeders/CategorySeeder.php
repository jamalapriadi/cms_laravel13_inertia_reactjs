<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            /**
             * Parent Categories
             */
            $phoneId = $this->createOrUpdateCategory([
                'name' => 'Phone',
                'slug' => 'phone',
                'parent_id' => null,
                'image' => null,
                'sort_order' => 1,
                'show_home' => true,
                'is_publish' => true,
            ]);

            $laptopId = $this->createOrUpdateCategory([
                'name' => 'Laptop',
                'slug' => 'laptop',
                'parent_id' => null,
                'image' => null,
                'sort_order' => 2,
                'show_home' => true,
                'is_publish' => true,
            ]);

            /**
             * Phone Categories
             */
            $phoneCategories = [
                [
                    'name' => 'Smartphone',
                    'slug' => 'smartphone',
                    'sort_order' => 1,
                ],
                [
                    'name' => 'Android Phone',
                    'slug' => 'android-phone',
                    'sort_order' => 2,
                ],
                [
                    'name' => 'iPhone',
                    'slug' => 'iphone',
                    'sort_order' => 3,
                ],
                [
                    'name' => 'Gaming Phone',
                    'slug' => 'gaming-phone',
                    'sort_order' => 4,
                ],
                [
                    'name' => 'Flagship Phone',
                    'slug' => 'flagship-phone',
                    'sort_order' => 5,
                ],
                [
                    'name' => 'Mid Range Phone',
                    'slug' => 'mid-range-phone',
                    'sort_order' => 6,
                ],
                [
                    'name' => 'Entry Level Phone',
                    'slug' => 'entry-level-phone',
                    'sort_order' => 7,
                ],
                [
                    'name' => 'Foldable Phone',
                    'slug' => 'foldable-phone',
                    'sort_order' => 8,
                ],
                [
                    'name' => 'Phone Accessories',
                    'slug' => 'phone-accessories',
                    'sort_order' => 9,
                ],
            ];

            foreach ($phoneCategories as $category) {
                $this->createOrUpdateCategory([
                    'name' => $category['name'],
                    'slug' => $category['slug'],
                    'parent_id' => $phoneId,
                    'image' => null,
                    'sort_order' => $category['sort_order'],
                    'show_home' => false,
                    'is_publish' => true,
                ]);
            }

            /**
             * Laptop Categories
             */
            $laptopCategories = [
                [
                    'name' => 'Laptop Gaming',
                    'slug' => 'laptop-gaming',
                    'sort_order' => 1,
                ],
                [
                    'name' => 'Laptop Office',
                    'slug' => 'laptop-office',
                    'sort_order' => 2,
                ],
                [
                    'name' => 'Laptop Student',
                    'slug' => 'laptop-student',
                    'sort_order' => 3,
                ],
                [
                    'name' => 'Ultrabook',
                    'slug' => 'ultrabook',
                    'sort_order' => 4,
                ],
                [
                    'name' => 'MacBook',
                    'slug' => 'macbook',
                    'sort_order' => 5,
                ],
                [
                    'name' => 'Windows Laptop',
                    'slug' => 'windows-laptop',
                    'sort_order' => 6,
                ],
                [
                    'name' => '2-in-1 Laptop',
                    'slug' => '2-in-1-laptop',
                    'sort_order' => 7,
                ],
                [
                    'name' => 'Workstation Laptop',
                    'slug' => 'workstation-laptop',
                    'sort_order' => 8,
                ],
                [
                    'name' => 'Laptop Accessories',
                    'slug' => 'laptop-accessories',
                    'sort_order' => 9,
                ],
            ];

            foreach ($laptopCategories as $category) {
                $this->createOrUpdateCategory([
                    'name' => $category['name'],
                    'slug' => $category['slug'],
                    'parent_id' => $laptopId,
                    'image' => null,
                    'sort_order' => $category['sort_order'],
                    'show_home' => false,
                    'is_publish' => true,
                ]);
            }
        });
    }

    private function createOrUpdateCategory(array $data): string
    {
        $existingCategory = DB::table('categories')
            ->where('slug', $data['slug'])
            ->first();

        if ($existingCategory) {
            DB::table('categories')
                ->where('id', $existingCategory->id)
                ->update([
                    'parent_id' => $data['parent_id'],
                    'name' => $data['name'],
                    'slug' => $data['slug'],
                    'image' => $data['image'],
                    'sort_order' => $data['sort_order'],
                    'show_home' => $data['show_home'],
                    'is_publish' => $data['is_publish'],
                    'updated_at' => now(),
                    'deleted_at' => null,
                ]);

            return $existingCategory->id;
        }

        $id = (string) Str::uuid();

        DB::table('categories')->insert([
            'id' => $id,
            'parent_id' => $data['parent_id'],
            'name' => $data['name'],
            'slug' => $data['slug'],
            'image' => $data['image'],
            'sort_order' => $data['sort_order'],
            'show_home' => $data['show_home'],
            'is_publish' => $data['is_publish'],
            'created_at' => now(),
            'updated_at' => now(),
            'deleted_at' => null,
        ]);

        return $id;
    }
}
