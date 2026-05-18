<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Buat Akun Super Admin (Utama)
        User::create([
            'name' => 'Jamal Apriadi',
            'email' => 'jamal.apriadi@gmail.com',
            'email_verified_at' => now(),
            'password' => Hash::make('Laravel13'), // Ganti dengan password yang aman
            'remember_token' => \Illuminate\Support\Str::random(10),
        ]);

    }
}
