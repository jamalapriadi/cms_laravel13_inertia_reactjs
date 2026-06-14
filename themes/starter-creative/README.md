# Starter Creative

`starter-creative` adalah starter theme developer untuk Laravel CMS. Theme ini memakai Blade untuk runtime CMS, tetapi menyediakan workflow development lokal terpisah di folder `source` untuk TailwindCSS v4, GSAP, GSAP TextPlugin, dan SwiperJS.

## Struktur Runtime

Runtime CMS hanya membutuhkan file berikut:

- `theme.json`
- `resources/views`
- `public`
- `screenshot.png`

Folder `source` hanya dipakai saat development theme di mesin developer atau CI.

## Development Theme di Lokal

1. Clone project CMS.
2. Jalankan `composer install`.
3. Jalankan `php artisan migrate --seed`.
4. Pastikan Theme Manager bisa diakses.
5. Copy starter theme menjadi theme baru:

```bash
cp -R themes/starter-creative themes/modern-store
```

6. Edit `themes/modern-store/theme.json`:

- ubah `name`
- ubah `slug`
- ubah `description`
- ubah semua namespace template dari `starter-creative::` menjadi `modern-store::`

7. Sinkronkan local theme ke database:

```bash
php artisan cms:themes:discover
```

8. Preview theme:

```text
/theme-preview/modern-store
```

9. Masuk ke folder source:

```bash
cd themes/modern-store/source
```

10. Install dependency:

```bash
npm install
```

11. Jalankan development mode:

```bash
npm run dev
```

12. Edit file berikut saat develop:

- `resources/views`
- `source/css/input.css`
- `source/js/theme.js`

13. Build production asset:

```bash
npm run build
```

14. Pastikan output final tersedia:

- `public/css/output.css`
- `public/js/theme.js`

## ZIP Production Theme

ZIP upload production minimal berisi:

```text
modern-store/
├── theme.json
├── screenshot.png
├── resources/views/
└── public/
    ├── css/output.css
    ├── js/theme.js
    └── images/
```

Untuk upload production, jangan sertakan:

- `source/node_modules`
- `.git`
- `.vite`
- `.DS_Store`
- file temporary
- cache
- file executable

Contoh command ZIP:

```bash
cd themes
zip -r modern-store.zip modern-store \
  -x "modern-store/source/node_modules/*" \
  -x "modern-store/.git/*" \
  -x "modern-store/.DS_Store"
```

`source` boleh tetap disertakan jika theme akan dibagikan sebagai developer starter, tetapi tidak wajib untuk upload production.

## Deploy Theme

### Via Dashboard Theme Manager

1. Build asset theme di lokal.
2. Buat ZIP production.
3. Login ke dashboard.
4. Buka Theme Manager.
5. Upload ZIP.
6. Preview theme.
7. Activate theme.
8. Jalankan clear cache jika diperlukan.
9. Cek frontend.

### Deploy Manual ke Server

1. Upload folder theme ke `themes/{slug}`.
2. Jika server tidak otomatis menyalin asset public theme, copy isi `public` ke `public/vendor/themes/{slug}`.
3. Jalankan:

```bash
php artisan cms:themes:discover
php artisan optimize:clear
```

4. Aktifkan theme dari dashboard.
5. Cek frontend.

## Catatan Deploy Penting

- Jangan menjalankan `npm install` di production CMS kecuali benar-benar dibutuhkan.
- Jangan menjalankan `npm run build` theme di server production.
- Build dilakukan di lokal developer machine atau CI.
- Production CMS hanya menerima asset final.
- Pastikan `APP_URL` benar.
- Pastikan `public/vendor/themes` writable oleh web server.
- Jika theme belum muncul, jalankan `php artisan optimize:clear`.

## Validasi Manual yang Disarankan

1. `starter-creative` muncul di Theme Manager.
2. Theme bisa dipreview lewat `/theme-preview/starter-creative`.
3. Theme bisa diaktifkan tanpa mengganggu dashboard.
4. Home tetap render saat posts, products, atau categories kosong.
5. `css/output.css` dan `js/theme.js` termuat.
6. `Swiper` dan `GSAP` tidak error saat elemen terkait tidak ada.
