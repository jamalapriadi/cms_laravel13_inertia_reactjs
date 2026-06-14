# Starter Theme

## 1. Apa Itu Starter Theme

`starter-store` adalah theme contoh bawaan untuk Theme Manager CMS ini. Tujuannya bukan menjadi theme final, tetapi menjadi fondasi aman untuk memulai theme baru.

Catatan:

- `starter-store` bukan fallback theme default CMS
- fallback bawaan untuk instalasi awal adalah `default-admin-login`
- `default-admin-login` dipakai saat belum ada theme frontend aktif dan halaman `/` perlu menampilkan form login berbasis auth existing

Prinsipnya:

- core Laravel tetap menangani route, query, business logic, validasi, dan data
- theme hanya menangani layer presentasi
- CMS hanya memakai file yang sudah siap pakai dari folder `resources/views` dan `public`

Starter theme ini membantu developer memahami:

- bentuk `theme.json`
- struktur Blade view yang diharapkan CMS
- cara memanggil asset theme
- cara memakai helper seperti `theme_setting()` dan `theme_assets()`
- cara menyiapkan ZIP production untuk di-upload ke dashboard

Jika Anda mencari theme fallback bawaan CMS, lihat folder berikut:

```text
themes/default-admin-login
```

## 2. Struktur Folder `starter-store`

Struktur aktual starter theme saat ini:

```text
themes/starter-store/
├── theme.json
├── screenshot.svg
├── resources/
│   └── views/
│       ├── categories/
│       │   └── show.blade.php
│       ├── components/
│       │   └── product-card.blade.php
│       ├── errors/
│       │   └── 404.blade.php
│       ├── layouts/
│       │   └── app.blade.php
│       ├── pages/
│       │   └── show.blade.php
│       ├── products/
│       │   ├── index.blade.php
│       │   └── show.blade.php
│       └── home.blade.php
└── public/
    ├── css/
    │   └── theme.css
    └── js/
        └── theme.js
```

Catatan penting:

- struktur di atas sudah cukup untuk runtime CMS
- folder `source/` belum ada di starter bawaan saat ini
- jika Anda ingin menjadikan theme sebagai template developer, Anda boleh menambahkan folder `source/`

Contoh struktur dengan folder `source/` opsional:

```text
themes/starter-store/
├── theme.json
├── screenshot.svg
├── resources/views/
├── public/
│   ├── css/theme.css
│   └── js/theme.js
└── source/
    ├── package.json
    ├── vite.config.js
    ├── src/
    │   ├── css/
    │   └── js/
    └── node_modules/
```

## 3. Penjelasan `theme.json`

File `theme.json` adalah manifest utama theme. CMS membaca file ini saat theme di-install dan saat theme aktif dipakai.

Contoh field penting di `starter-store`:

```json
{
  "name": "Starter Store",
  "slug": "starter-store",
  "version": "1.0.0",
  "author": "Jamal Apriadi",
  "description": "Starter storefront theme untuk CMS Laravel.",
  "type": "theme",
  "css_framework": "tailwindcss",
  "namespace": "App\\Themes\\StarterStore",
  "provider": null,
  "preview": "screenshot.svg",
  "templates": {
    "home": "starter-store::home",
    "page": "starter-store::pages.show",
    "product_index": "starter-store::products.index",
    "product_show": "starter-store::products.show",
    "category_show": "starter-store::categories.show",
    "404": "starter-store::errors.404"
  },
  "assets": {
    "css": ["css/theme.css"],
    "js": ["js/theme.js"]
  }
}
```

Penjelasan field:

- `name`: nama theme yang tampil di dashboard
- `slug`: identitas theme, dipakai untuk folder, namespace view, dan asset publik
- `version`: versi theme
- `author`: nama pembuat
- `description`: ringkasan theme
- `type`: tipe manifest, harus sesuai untuk theme
- `css_framework`: informasi stack styling theme
- `namespace`: metadata namespace internal theme
- `provider`: saat ini sebaiknya `null`, karena CMS tidak menjalankan provider theme upload
- `preview`: file screenshot preview theme
- `supports`: daftar fitur yang didukung theme
- `templates`: peta key template CMS ke namespace Blade theme
- `assets`: daftar asset final hasil build
- `settings`: field konfigurasi yang akan muncul di halaman customize theme

## 4. Penjelasan `resources/views`

Folder `resources/views` berisi seluruh Blade template yang dipakai theme.

Isi starter theme saat ini:

- `layouts/app.blade.php`: layout utama storefront
- `home.blade.php`: homepage
- `pages/show.blade.php`: halaman CMS biasa
- `products/index.blade.php`: daftar produk
- `products/show.blade.php`: detail produk
- `categories/show.blade.php`: detail kategori
- `errors/404.blade.php`: halaman 404
- `components/product-card.blade.php`: komponen kartu produk

Contoh penggunaan namespace view di starter theme:

```blade
@extends('starter-store::layouts.app')
```

dan:

```blade
@include('starter-store::components.product-card', ['product' => $product])
```

Artinya Blade theme dirender lewat namespace `starter-store::`, bukan lewat path file biasa.

## 5. Penjelasan `public/css/theme.css` dan `public/js/theme.js`

Kedua file ini adalah asset final yang benar-benar dipakai CMS saat theme aktif.

- `public/css/theme.css`: stylesheet final storefront
- `public/js/theme.js`: JavaScript final storefront

Di layout starter theme, asset dimuat lewat helper:

```blade
@foreach(theme_assets('css') as $css)
    <link rel="stylesheet" href="{{ theme_asset($css) }}">
@endforeach

@foreach(theme_assets('js') as $js)
    <script src="{{ theme_asset($js) }}" defer></script>
@endforeach
```

Jangan arahkan `theme.json` ke file source mentah. CMS hanya boleh menerima file hasil build yang sudah ada di dalam `public/`.

## 6. Penjelasan Folder `source` untuk Developer

Folder `source/` adalah workspace developer untuk mengerjakan source CSS, JS, Tailwind, Vite, atau tooling lain. Folder ini tidak dipakai runtime CMS.

Folder ini bersifat opsional. Anda boleh:

- menyertakannya jika theme akan dibagikan sebagai template developer
- menghapusnya dari ZIP production jika yang dibagikan hanya hasil final

Contoh isi `source/`:

```text
themes/my-new-theme/source/
├── package.json
├── package-lock.json
├── vite.config.js
├── src/
│   ├── css/
│   │   └── theme.css
│   └── js/
│       └── theme.js
├── node_modules/
└── .vite/
```

## 7. Cara Menggandakan `starter-store` Menjadi Theme Baru

Cara paling aman adalah menyalin folder starter theme lalu mengganti identitasnya.

Contoh:

```bash
cp -R themes/starter-store themes/my-new-theme
```

Setelah itu, perbarui:

- nama folder `starter-store` menjadi `my-new-theme`
- field `name` di `theme.json`
- field `slug` di `theme.json`
- semua namespace view `starter-store::`
- file screenshot jika ingin diganti
- asset final di folder `public/`

## 8. Cara Mengganti Slug Theme

Slug theme harus konsisten di beberapa tempat:

1. nama folder theme
2. `theme.json > slug`
3. `theme.json > templates`
4. semua referensi namespace Blade di file `.blade.php`
5. jika perlu, metadata `namespace` di `theme.json`

Contoh perubahan:

- dari: `starter-store`
- menjadi: `my-new-theme`

Maka:

```json
{
  "slug": "my-new-theme"
}
```

## 9. Cara Mengganti Namespace View dari `starter-store::` ke `slug-theme-baru::`

Setelah slug diganti, semua namespace view juga harus ikut diganti.

Contoh:

- sebelum:

```blade
@extends('starter-store::layouts.app')
@include('starter-store::components.product-card')
```

- sesudah:

```blade
@extends('my-new-theme::layouts.app')
@include('my-new-theme::components.product-card')
```

Perubahan ini juga wajib dilakukan di `theme.json` pada bagian `templates`.

Contoh:

```json
"templates": {
  "home": "my-new-theme::home",
  "page": "my-new-theme::pages.show",
  "product_index": "my-new-theme::products.index",
  "product_show": "my-new-theme::products.show",
  "category_show": "my-new-theme::categories.show",
  "404": "my-new-theme::errors.404"
}
```

## 10. Cara Mengedit Blade View

Edit file di dalam:

```text
themes/my-new-theme/resources/views/
```

Contoh pekerjaan yang biasa dilakukan:

- mengubah markup homepage
- mengatur layout header dan footer
- mengganti struktur card produk
- menambah section landing page
- menyesuaikan halaman kategori, produk, dan 404

Saat mengedit Blade, ingat:

- jangan pindahkan business logic ke theme
- gunakan data yang sudah dikirim core controller
- gunakan helper seperti `theme_setting()`, `theme_assets()`, dan `theme_asset()`

## 11. Cara Mengedit Tailwind Source

Jika Anda ingin memakai Tailwind atau tool frontend lain, kerjakan di folder `source/`.

Contoh workflow:

- simpan file source Tailwind di `themes/my-new-theme/source/src/css/`
- simpan entry JavaScript di `themes/my-new-theme/source/src/js/`
- hasil build harus diarahkan ke:
  - `themes/my-new-theme/public/css/theme.css`
  - `themes/my-new-theme/public/js/theme.js`

Catatan:

- starter theme bawaan saat ini hanya menyertakan asset final
- jika ingin workflow Tailwind penuh, tambahkan sendiri folder `source/`

## 12. Cara Build Asset Secara Lokal

Contoh flow developer theme:

```bash
cd themes/my-new-theme/source
npm install
npm run dev
npm run build
```

Setelah build selesai, pastikan file berikut tersedia:

```text
themes/my-new-theme/public/css/theme.css
themes/my-new-theme/public/js/theme.js
```

`npm run dev` dipakai untuk pengembangan lokal. `npm run build` dipakai untuk menghasilkan asset final yang akan di-upload ke CMS.

## 13. Cara Membuat ZIP Production

ZIP production harus berisi file runtime yang dibutuhkan CMS.

Contoh isi ZIP production:

```text
my-new-theme/
├── theme.json
├── screenshot.png
├── resources/views/
└── public/
```

Catatan:

- pada starter bawaan saat ini file preview bernama `screenshot.svg`
- Anda boleh memakai `screenshot.png`, `screenshot.jpg`, atau `screenshot.svg`
- pastikan nilai `preview` di `theme.json` sesuai nama file yang dipakai

File berikut tidak wajib ikut ZIP production:

- `node_modules`
- `.git`
- `.vite`
- `package-lock.json`
- `source` jika tidak ingin membagikan source theme

Tetapi `source` boleh ikut ZIP jika theme tersebut memang ingin dijadikan developer template.

## 14. Cara Upload ZIP ke CMS

Setelah ZIP siap:

1. buka dashboard admin
2. masuk ke halaman `Themes`
3. gunakan form upload ZIP
4. pilih file ZIP theme production
5. upload dan tunggu proses install selesai

CMS akan:

- membaca `theme.json`
- memvalidasi struktur theme
- menyalin folder theme ke direktori theme server
- menyalin asset publik ke lokasi runtime

CMS tidak akan:

- menjalankan `npm install`
- menjalankan `npm run build`
- menjalankan `composer install`
- menjalankan provider theme

## 15. Cara Preview Theme

Setelah theme berhasil di-install, gunakan tombol `Preview` di halaman Theme Manager.

Route preview yang dipakai sistem berbentuk:

```text
/theme-preview/{slug}
```

Contoh:

```text
/theme-preview/starter-store
```

Preview berguna untuk memeriksa tampilan theme sebelum diaktifkan.

## 16. Cara Activate Theme

Jika hasil preview sudah sesuai:

1. buka halaman `Themes`
2. cari theme yang ingin dipakai
3. klik tombol `Activate`

Setelah aktif:

- storefront publik akan memakai template dari theme tersebut
- helper `theme_assets()` dan `theme_template()` akan mengarah ke theme aktif
- setting yang ada di halaman customize akan ikut dipakai saat render

## 17. Checklist Sebelum Theme Di-upload

Gunakan checklist ini sebelum membuat ZIP production:

- `theme.json` valid dan bisa dibaca
- `slug` sudah final dan konsisten
- namespace view sudah tidak memakai slug lama
- semua key pada `templates` mengarah ke file yang benar
- `preview` mengarah ke file screenshot yang benar
- file `public/css/theme.css` sudah ada
- file `public/js/theme.js` sudah ada
- Blade view tidak berisi logic aplikasi yang seharusnya ada di core
- tidak ada file PHP biasa selain `.blade.php`
- tidak ada file berbahaya atau file development yang tidak perlu
- preview theme sudah dicek
- customize setting sudah dites jika theme memakai `settings`
- ZIP hanya berisi file yang benar-benar diperlukan untuk runtime

## Ringkasan Workflow Developer

Contoh alur kerja singkat:

1. gandakan `starter-store`
2. ubah nama folder dan slug theme
3. ganti semua namespace view
4. edit Blade view
5. edit source CSS dan JS di folder `source/`
6. jalankan build lokal
7. pastikan hasil build masuk ke folder `public/`
8. buat ZIP production
9. upload ZIP ke CMS
10. preview
11. activate

Contoh flow build:

```bash
cd themes/my-new-theme/source
npm install
npm run dev
npm run build
```

Target akhir yang harus tersedia:

```text
themes/my-new-theme/public/css/theme.css
themes/my-new-theme/public/js/theme.js
```
