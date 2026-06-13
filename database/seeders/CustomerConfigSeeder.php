<?php

namespace Database\Seeders;

use App\Models\Dashboard\Option;
use Illuminate\Database\Seeder;

class CustomerConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $configs = [
            'allow_customer_registration' => '1',
            'allow_customer_login' => '1',
            'allow_password_reset' => '1',
            'require_email_verification' => '0',
        ];

        foreach ($configs as $key => $value) {
            Option::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }
}
