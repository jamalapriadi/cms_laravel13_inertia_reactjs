<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // IndonesiaSeeder::class,
            LanguageSeeder::class,
            CountriesTableSeeder::class,
            UserSeeder::class,
            RolePermissionSeeder::class,
            UnitSeeder::class,
            BrandSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            ProductCollectionSeeder::class,
            FaqSeeder::class,
            SiteContentSeeder::class,
            PostSampleSeeder::class,
        ]);
    }
}
