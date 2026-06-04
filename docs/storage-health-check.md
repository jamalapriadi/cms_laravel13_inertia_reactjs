# Laravel Storage Health Check

Project ini menyediakan command:

```bash
php artisan storage:health-check
```

Command ini mengecek konfigurasi disk `public`, folder storage yang dibutuhkan Laravel, permission write, symlink `public/storage`, hidden file di `storage/app/public`, test write/read file, dan akses `mimeType()` untuk file valid.

## Auto-fix Aman

```bash
php artisan storage:health-check --fix
```

Mode `--fix` akan mencoba:

- Membuat folder `storage/app/public`.
- Membuat folder `storage/framework/cache`, `storage/framework/sessions`, dan `storage/framework/views`.
- Membuat folder `bootstrap/cache`.
- Menghapus hidden file yang aman dihapus dari `storage/app/public`, yaitu `.gitignore` dan `.DS_Store`.
- Membuat ulang symlink `public/storage` jika symlink hilang atau mengarah ke target yang salah.
- Menjalankan `php artisan optimize:clear`.

Mode ini tidak menjalankan `chown` atau `chmod` dari PHP.

## Permission Manual VPS

Jalankan dari root project Laravel:

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo find storage bootstrap/cache -type d -exec chmod 775 {} \;
sudo find storage bootstrap/cache -type f -exec chmod 664 {} \;
```

Jika `public/storage` bukan symlink atau mengarah ke target yang salah:

```bash
rm public/storage
php artisan storage:link
php artisan optimize:clear
```

Hati-hati memakai `rm public/storage`: pastikan path tersebut symlink atau folder yang memang aman dipindahkan.

## Penyebab Umum `UnableToWriteFile`

- User PHP-FPM/Nginx, biasanya `www-data`, tidak punya permission write ke `storage`.
- Folder `storage/app/public` belum ada.
- `config/filesystems.php` mengarah ke root disk yang salah.
- Disk penuh atau mount filesystem read-only.
- SELinux/AppArmor atau policy server membatasi write.

## Penyebab Umum `UnableToRetrieveMetadata mime_type`

Error seperti:

```text
Unable to retrieve the mime_type for file at location: .gitignore
```

umumnya terjadi karena file manager/media library memproses semua file di disk public, termasuk hidden file seperti `.gitignore` atau `.DS_Store`. Hidden file bukan media upload publik dan tidak perlu dipanggil `mimeType()`.

Kode media library sekarang harus:

- Skip file atau folder dengan basename diawali titik.
- Hanya memproses extension image valid: `jpg`, `jpeg`, `png`, `webp`, `gif`, `svg`.
- Membungkus pembacaan metadata seperti `mimeType()`, `size()`, dan `lastModified()` dengan `try/catch`.

## Script VPS

Script siap pakai tersedia di:

```bash
scripts/fix-laravel-storage.sh
```

Default project path:

```bash
/var/www/dashboard.gitatrading-store.com
```

Jalankan:

```bash
sudo bash scripts/fix-laravel-storage.sh
```

Atau dengan path custom:

```bash
sudo bash scripts/fix-laravel-storage.sh /var/www/dashboard.gitatrading-store.com
```
