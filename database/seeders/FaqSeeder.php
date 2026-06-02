<?php

namespace Database\Seeders;

use App\Models\Shop\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            [
                'question' => 'Bagaimana cara melakukan pemesanan?',
                'answer' => 'Pilih produk, masukkan ke keranjang, lalu lanjutkan ke checkout untuk menyelesaikan pesanan.',
                'type' => 'general',
                'position' => 'homepage',
                'show_home' => true,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'question' => 'Metode pembayaran apa saja yang tersedia?',
                'answer' => 'Kami mendukung transfer bank, e-wallet, dan metode pembayaran lain yang tersedia saat checkout.',
                'type' => 'payment',
                'position' => 'homepage',
                'show_home' => true,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'question' => 'Berapa lama proses pengiriman?',
                'answer' => 'Pesanan diproses pada hari kerja dan estimasi pengiriman mengikuti kurir serta lokasi tujuan.',
                'type' => 'shipping',
                'position' => 'homepage',
                'show_home' => true,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'question' => 'Apakah produk bisa dikembalikan?',
                'answer' => 'Produk dapat diajukan retur sesuai syarat dan ketentuan pada kebijakan retur kami.',
                'type' => 'general',
                'position' => 'homepage',
                'show_home' => true,
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'question' => 'Bagaimana cara menggunakan kode promo?',
                'answer' => 'Masukkan kode promo di halaman checkout sebelum menyelesaikan pembayaran.',
                'type' => 'promo',
                'position' => 'homepage',
                'show_home' => true,
                'is_active' => true,
                'sort_order' => 5,
            ],
        ];

        foreach ($rows as $row) {
            Faq::updateOrCreate(
                [
                    'question' => $row['question'],
                    'type' => $row['type'],
                ],
                $row,
            );
        }
    }
}
