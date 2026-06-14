# Starter Creative Source

Folder `source` adalah workspace development untuk theme developer. Folder ini aman dihapus dari upload production selama asset final di `../public` sudah dibuild.

## Instalasi

```bash
cd themes/starter-creative/source
npm install
```

## Development

Mode development menjalankan watcher CSS Tailwind v4 dan Vite JS secara paralel:

```bash
npm run dev
```

Output yang diperbarui:

- `../public/css/output.css`
- `../public/js/theme.js`

## Build Production

```bash
npm run build
```

Perintah ini akan:

1. build TailwindCSS v4 ke `../public/css/output.css`
2. bundle JS theme ke `../public/js/theme.js`

## File yang Biasanya Diedit

- `../resources/views`
- `./css/input.css`
- `./js/theme.js`

## Catatan

- Runtime CMS tidak menggunakan `@vite()`.
- Jangan arahkan build ke `public/build` core Laravel.
- Asset final theme harus tetap stabil di `css/output.css` dan `js/theme.js`.
