# Fitur Sitemap Otomatis

Sitemap otomatis di-generate secara dinamis untuk memudahkan mesin pencari (search engine) merayapi (crawling) seluruh halaman publik yang aktif pada website ini.

## Konsep Sitemap Otomatis

Sitemap ini terintegrasi langsung dengan database Laravel. Setiap kali ada perubahan data publik (seperti dibuat, diedit slug-nya, status publish berubah, di-soft delete, atau dihapus permanen), cache sitemap akan dibersihkan secara instan menggunakan Eloquent Observers.

Untuk performa optimal, sitemap tidak di-generate ulang saat data disimpan. Sebaliknya, cache sitemap akan dihapus (cache invalidation), dan XML sitemap baru akan di-generate kembali saat ada pengunjung/bot yang mengakses URL `/sitemap.xml`.

---

## URL Sitemap

### 1. Sitemap Index Mode (Default)
Secara default, system menggunakan sitemap index untuk memisahkan sitemap berdasarkan tipe data agar tidak membebani memory ketika jumlah data sangat besar.

- **Main Sitemap Index**: `/sitemap.xml`
- **Sub-sitemaps**:
  - Pages: `/sitemaps/pages.xml` (termasuk homepage `/`)
  - Products: `/sitemaps/products.xml` (termasuk halaman index `/products` jika rute tersedia)
  - Categories: `/sitemaps/categories.xml`
  - Posts: `/sitemaps/posts.xml`
  - Brands: `/sitemaps/brands.xml`
  - Collections: `/sitemaps/collections.xml`

*Catatan: Sub-sitemap di atas hanya akan terdaftar dalam sitemap index dan bisa diakses jika terdapat data publik yang aktif.*

### 2. Single Flat Sitemap Mode
Dapat diaktifkan dengan mengubah konfigurasi `sitemap_index` menjadi `false` di `config/cms_sitemap.php`. Semua URL akan disajikan dalam satu file `/sitemap.xml`.

---

## Data Yang Masuk dan Tidak Masuk Sitemap

### Data yang Masuk:
- Data dengan status/visibility **Published** / **Active** / **Public**.
- Record yang memiliki slug valid.
- Tanggal modifikasi terakhir (`lastmod`) menggunakan kolom `updated_at`.

### Data yang Dieksklusi (TIDAK Masuk):
- Data berstatus Draft, Private, Inactive, atau Archived.
- Data yang di-soft delete (`deleted_at` tidak null).
- URL-URL admin, dashboard, authentication (`/login`, `/register`), API endpoints, dan media storage.

---

## Cache Sitemap

Sitemap menggunakan mechanism `Cache::rememberForever` agar query database hanya dieksekusi sekali dan performa website tetap super cepat.

### Cara Membersihkan Cache

Cache otomatis bersih saat ada perubahan data melalui observer. Namun, jika Anda ingin membersihkannya secara manual, Anda bisa menggunakan command artisan:

```bash
php artisan sitemap:clear
```

### Melakukan Warm Up Cache

Jika Anda ingin melakukan generate cache sitemap terlebih dahulu sebelum ada request masuk (misalnya setelah deployment), jalankan command:

```bash
php artisan sitemap:generate
```

---

## Cara Menambahkan Model Baru ke Sitemap

Jika di masa mendatang Anda ingin menambahkan tipe data baru (misalnya `Tag` atau `Promo`), ikuti langkah berikut:

### 1. Update Konfigurasi `config/cms_sitemap.php`
Tambahkan tipe baru di bagian array `include`:

```php
'include' => [
    ...
    'tags' => true,
],
```

### 2. Tambahkan Method Pengambilan URL di `SitemapManager`
Buka `App\CMS\Sitemap\SitemapManager.php` dan tambahkan method baru:

```php
public function getTagUrls(): array
{
    if (!config('cms_sitemap.include.tags') || !class_exists(\App\Models\Tag::class)) {
        return [];
    }

    try {
        $tags = \App\Models\Tag::where('is_active', true)->get();
        $urls = [];
        foreach ($tags as $tag) {
            $urls[] = [
                'loc' => route('frontend.tags.show', $tag->slug),
                'lastmod' => $tag->updated_at?->toIso8601String(),
                'changefreq' => 'weekly',
                'priority' => 0.5,
            ];
        }
        return $urls;
    } catch (\Throwable $e) {
        return [];
    }
}
```

Dan daftarkan di dalam method `getUrlsForType()` pada switch-case block.

### 3. Buat dan Daftarkan Observer untuk Model Baru
Buat observer di `app/Observers/TagObserver.php`:

```php
<?php

namespace App\Observers;

class TagObserver
{
    use ClearsSitemapCache;
}
```

Daftarkan observer tersebut di `app/Providers/AppServiceProvider.php` di dalam array `$observers`:

```php
\App\Models\Tag::class => \App\Observers\TagObserver::class,
```

---

## Integrasi Lainnya

### Robots.txt
System secara otomatis menambahkan line deklarasi Sitemap pada file `public/robots.txt`:
```
Sitemap: http://your-domain.com/sitemap.xml
```
Juga didukung oleh rute dynamic fallback jika file fisik tidak dapat diakses langsung, memastikan SEO tool selalu dapat mendeteksi lokasi sitemap.xml.

### Integrasi dengan Theme Manager
Rute `/sitemap.xml` berjalan pada layer routing utama Laravel yang terpisah dari Theme rendering. Oleh karena itu, sitemap **tidak bergantung pada theme aktif** dan akan tetap berjalan dengan normal walaupun theme aktif diubah-ubah (`starter-store`, `blank-404`, atau theme lainnya).
