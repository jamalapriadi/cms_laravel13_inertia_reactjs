# Theme Manager

## Konsep

Theme Manager memisahkan dashboard core Laravel dari storefront publik. Dashboard tetap berjalan dengan Inertia React, sementara frontend publik dirender dengan Blade view dari theme aktif.

Prinsip utamanya:

- Core Laravel tetap memegang business logic, query, validasi, dan route.
- Theme hanya membawa presentasi: `theme.json`, Blade views, asset final hasil build, screenshot, dan setting manifest.
- Upload theme tidak menjalankan `composer install`, `npm install`, `npm run build`, migration, atau service provider dari theme.

## Struktur ZIP Theme

```text
modern-store/
├── theme.json
├── screenshot.png
├── resources/
│   └── views/
│       ├── layouts/
│       │   └── app.blade.php
│       ├── home.blade.php
│       ├── pages/
│       │   └── show.blade.php
│       ├── products/
│       │   ├── index.blade.php
│       │   └── show.blade.php
│       ├── categories/
│       │   └── show.blade.php
│       └── components/
├── public/
│   ├── css/
│   │   └── theme.css
│   ├── js/
│   │   └── theme.js
│   └── images/
└── source/
```

Catatan:

- Folder `public/` harus sudah berisi asset final hasil build.
- Folder `source/` boleh ikut di ZIP, tetapi tidak dipakai runtime CMS.
- Screenshot preview akan disalin ke asset publik theme agar bisa ditampilkan di dashboard.

## Contoh `theme.json`

```json
{
  "name": "Modern Store",
  "slug": "modern-store",
  "version": "1.0.0",
  "author": "Jamal Apriadi",
  "description": "Theme ecommerce modern untuk CMS Laravel.",
  "type": "theme",
  "css_framework": "tailwindcss",
  "namespace": "Jamstackid\\ModernStoreTheme",
  "provider": null,
  "preview": "screenshot.png",
  "supports": ["pages", "products", "categories", "menus", "theme-settings"],
  "templates": {
    "home": "modern-store::home",
    "page": "modern-store::pages.show",
    "product_index": "modern-store::products.index",
    "product_show": "modern-store::products.show",
    "category_show": "modern-store::categories.show",
    "404": "modern-store::errors.404"
  },
  "assets": {
    "css": ["css/theme.css"],
    "js": ["js/theme.js"]
  },
  "settings": {
    "primary_color": {
      "type": "color",
      "label": "Primary Color",
      "default": "#16a34a"
    }
  }
}
```

Aturan validasi:

- `name`, `slug`, `version`, `templates`, dan `assets.css` wajib ada.
- `slug` harus sudah aman dan setara dengan hasil `Str::slug(...)`.
- Semua template harus memakai namespace `slug::`.

## Alur Install Theme

1. Admin upload file ZIP dari dashboard.
2. ZIP diextract ke temporary path `storage/app/cms/temp/themes/{uuid}`.
3. Sistem mendeteksi root folder theme dan membaca `theme.json`.
4. Manifest dan file divalidasi.
5. Folder theme disalin ke `themes/{slug}`.
6. Asset final disalin ke `public/vendor/themes/{slug}`.
7. Record theme disimpan ke tabel `themes`.
8. Setting kustom theme disimpan ke tabel `theme_settings`.

## Aturan Keamanan

Theme upload akan ditolak jika ditemukan:

- file executable seperti `.exe`, `.sh`, `.bat`, `.cmd`, `.phtml`, `.phar`
- symbolic link
- path traversal
- file PHP biasa di luar `.blade.php`
- file tersembunyi mencurigakan

CMS juga tidak akan:

- menjalankan provider dari theme upload
- menjalankan composer
- menjalankan npm
- menjalankan migration theme
- mengeksekusi command apa pun dari theme

## Helper Theme

Helper global yang tersedia:

- `theme_asset('css/theme.css')`
- `theme_assets('css')`
- `theme_setting('primary_color', '#16a34a')`
- `theme_template('home')`

Contoh:

```blade
@foreach(theme_assets('css') as $css)
    <link rel="stylesheet" href="{{ theme_asset($css) }}">
@endforeach
```

## Customize Theme

Field customize diambil dari `settings` pada `theme.json`. Tipe yang didukung:

- `color`
- `text`
- `textarea`
- `boolean`
- `select`
- `number`
- `media`

Jika setting belum pernah disimpan, CMS otomatis memakai `default` dari manifest.

## Template Key Standar

- `home`
- `page`
- `product_index`
- `product_show`
- `category_show`
- `404`

## Tailwind CSS

Theme bebas memakai TailwindCSS, tetapi build tetap tanggung jawab developer theme. CMS hanya akan memakai file final yang ada di:

- `public/css/theme.css`
- `public/js/theme.js`

Dashboard dan storefront tidak berbagi bundle CSS.

## Starter Theme

Starter theme bawaan tersedia di:

```text
themes/starter-store
```

Theme ini bisa dipakai sebagai acuan struktur ZIP, helper, dan pembagian layout Blade + asset final.

## Built-In Themes

Selain `starter-store`, CMS juga memiliki dua built-in fallback theme:

```text
themes/default-admin-login
themes/blank-404
```

Perbedaan fungsinya:

- `default-admin-login`: halaman utama menampilkan form login administrator saat belum ada storefront theme utama
- `blank-404`: halaman publik menampilkan halaman aman seperti "Website belum tersedia", "404", atau "Template belum tersedia"
- `starter-store`: theme contoh storefront ecommerce lengkap untuk developer theme

`blank-404` cocok dipakai untuk kondisi:

- frontend publik belum siap dipublish
- maintenance-safe mode untuk route frontend yang dirender lewat `ThemeManager`
- fallback aman saat template theme aktif hilang atau rusak

Catatan penting:

- fallback login tetap memakai endpoint auth existing project, bukan mengganti sistem auth
- `blank-404` tidak mengambil alih error handling Laravel secara penuh, tetapi menjadi fallback untuk route frontend yang memang dirender lewat `ThemeManager`
- route admin, auth, API, storage, media, dan route internal lain tetap berjalan normal karena tidak memakai renderer theme frontend
- saat theme frontend lain aktif, fallback bawaan hanya dipakai jika template theme aktif tidak ditemukan atau theme aktif rusak

## Mengaktifkan `blank-404`

1. Buka dashboard Theme Manager.
2. Pastikan theme `Blank 404` sudah muncul sebagai installed theme.
3. Klik activate pada card theme tersebut.
4. Route frontend publik seperti `/`, page publik, product, dan category akan memakai tampilan aman dari `blank-404`.

## Mengganti Fallback Theme

Fallback default dikendalikan dari konfigurasi:

```php
// config/themes.php
'fallback_theme_slug' => 'default-admin-login',
```

Nilai yang didukung untuk built-in fallback saat ini:

- `default-admin-login`
- `blank-404`
- `starter-store`

Contoh jika ingin menjadikan blank mode sebagai fallback utama:

```php
// config/themes.php
'fallback_theme_slug' => 'blank-404',
```

Catatan kompatibilitas:

- `fallback_slug` lama masih dibaca untuk menjaga kompatibilitas konfigurasi lama
- `fallback_theme_slug` adalah konfigurasi utama yang disarankan

Jika nanti CMS sudah memiliki theme frontend utama, ada dua pendekatan:

- aktifkan theme frontend utama dari Theme Manager agar fallback tidak dipakai lagi
- atau ubah `fallback_theme_slug` ke built-in fallback yang paling sesuai kebutuhan
