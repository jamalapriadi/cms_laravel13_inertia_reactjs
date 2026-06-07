<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Buat Akun Super Admin (Utama)
        User::updateOrCreate(
            ['email' => 'jamal.apriadi@gmail.com'],
            [
                'name' => 'Jamal Apriadi',
                'email_verified_at' => now(),
                'password' => Hash::make('Laravel13'),
                'remember_token' => Str::random(10),
            ],
        );

    }
}
