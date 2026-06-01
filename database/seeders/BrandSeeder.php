<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            [
                'name' => 'Apple',
                'logo' => null,
                'description' => 'Brand smartphone premium asal Amerika Serikat yang dikenal dengan produk iPhone.',
            ],
            [
                'name' => 'Samsung',
                'logo' => null,
                'description' => 'Brand elektronik dan smartphone asal Korea Selatan dengan seri Galaxy.',
            ],
            [
                'name' => 'Xiaomi',
                'logo' => null,
                'description' => 'Brand smartphone asal China yang dikenal dengan harga kompetitif dan spesifikasi tinggi.',
            ],
            [
                'name' => 'OPPO',
                'logo' => null,
                'description' => 'Brand smartphone yang populer dengan fitur kamera dan desain modern.',
            ],
            [
                'name' => 'Vivo',
                'logo' => null,
                'description' => 'Brand smartphone yang fokus pada kamera, desain, dan performa harian.',
            ],
            [
                'name' => 'Realme',
                'logo' => null,
                'description' => 'Brand smartphone dengan target anak muda, harga terjangkau, dan performa kompetitif.',
            ],
            [
                'name' => 'Infinix',
                'logo' => null,
                'description' => 'Brand smartphone dengan pilihan produk entry-level hingga mid-range.',
            ],
            [
                'name' => 'Tecno',
                'logo' => null,
                'description' => 'Brand smartphone yang menawarkan produk dengan harga ekonomis dan fitur lengkap.',
            ],
            [
                'name' => 'ASUS',
                'logo' => null,
                'description' => 'Brand teknologi yang juga memproduksi smartphone seperti seri ROG Phone dan Zenfone.',
            ],
            [
                'name' => 'Google',
                'logo' => null,
                'description' => 'Brand pembuat smartphone Pixel dengan pengalaman Android murni.',
            ],
            [
                'name' => 'Huawei',
                'logo' => null,
                'description' => 'Brand teknologi asal China yang dikenal dengan smartphone premium dan kamera berkualitas.',
            ],
            [
                'name' => 'Honor',
                'logo' => null,
                'description' => 'Brand smartphone yang sebelumnya terkait dengan Huawei dan kini berdiri sendiri.',
            ],
            [
                'name' => 'Nokia',
                'logo' => null,
                'description' => 'Brand legendaris yang juga memiliki lini smartphone berbasis Android.',
            ],
            [
                'name' => 'Sony',
                'logo' => null,
                'description' => 'Brand elektronik asal Jepang dengan lini smartphone Xperia.',
            ],
            [
                'name' => 'OnePlus',
                'logo' => null,
                'description' => 'Brand smartphone yang dikenal dengan performa tinggi dan pengalaman Android yang ringan.',
            ],
        ];

        foreach ($brands as $brand) {
            DB::table('brands')->updateOrInsert(
                [
                    'slug' => Str::slug($brand['name']),
                ],
                [
                    'id' => (string) Str::uuid(),
                    'name' => $brand['name'],
                    'slug' => Str::slug($brand['name']),
                    'logo' => $brand['logo'],
                    'description' => $brand['description'],
                    'is_active' => true,
                    'created_by' => null,
                    'updated_by' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                    'deleted_at' => null,
                ]
            );
        }
    }
}