<?php

namespace Database\Factories\Shop;

use App\Models\Shop\CashierSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CashierSession>
 */
class CashierSessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'cashier_id' => User::factory(),
            'opened_at' => now(),
            'opening_cash' => $this->faker->numberBetween(100000, 1000000),
            'status' => 'open',
            'note' => $this->faker->sentence(),
        ];
    }
}
