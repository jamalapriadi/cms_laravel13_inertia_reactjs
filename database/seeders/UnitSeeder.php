<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $units = [
            [
                'name' => 'Piece',
                'code' => 'PCS',
                'description' => 'Single item / per piece',
            ],
            [
                'name' => 'Box',
                'code' => 'BOX',
                'description' => 'Box packaging unit',
            ],
            [
                'name' => 'Kilogram',
                'code' => 'KG',
                'description' => 'Weight in kilograms',
            ],
            [
                'name' => 'Gram',
                'code' => 'GR',
                'description' => 'Weight in grams',
            ],
            [
                'name' => 'Liter',
                'code' => 'LTR',
                'description' => 'Volume in liters',
            ],
            [
                'name' => 'Milliliter',
                'code' => 'ML',
                'description' => 'Volume in milliliters',
            ],
            [
                'name' => 'Meter',
                'code' => 'M',
                'description' => 'Length in meters',
            ],
            [
                'name' => 'Centimeter',
                'code' => 'CM',
                'description' => 'Length in centimeters',
            ],
            [
                'name' => 'Pack',
                'code' => 'PACK',
                'description' => 'Pack unit',
            ],
            [
                'name' => 'Set',
                'code' => 'SET',
                'description' => 'Set or bundle unit',
            ],
        ];

        foreach ($units as $unit) {
            Unit::updateOrCreate(
                [
                    'code' => $unit['code'],
                ],
                [
                    'name' => $unit['name'],
                    'description' => $unit['description'],
                    'is_active' => true,
                ],
            );
        }
    }
}