<?php

namespace Database\Seeders;

use App\Models\Dashboard\Country;
use Illuminate\Database\Seeder;

class CountriesTableSeeder extends Seeder
{
    protected array $countries;

    public function __construct()
    {
        $this->countries = include __DIR__.'/countries.php';
    }

    public function run(): void
    {
        foreach ($this->countries as $key => $country) {
            Country::create([
                'name' => $country['name']['common'],
                'name_official' => $country['name']['official'],
                'cca2' => $country['cca2'],
                'cca3' => $country['cca3'],
                'flag' => $country['flag'],
                'latitude' => $country['latlng'][0],
                'longitude' => $country['latlng'][1],
                'currencies' => json_encode($country['currencies']),
            ]);
        }
    }
}
