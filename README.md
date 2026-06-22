# 🚀 BlockPress CMS (Laravel 13 + Inertia + React)

A modern **Laravel 13 CMS Starter Pack + Block-Based Page Builder System** inspired by WordPress Gutenberg and Webflow.

This project combines a traditional CMS architecture (Posts, Categories, RBAC) with a **modern block-based editor system**, making it suitable for building:

- SaaS CMS platforms
- Ticketing systems
- E-commerce content pages
- Landing page builders
- Wedding invitation websites
- Game top-up platforms
- Custom web applications

---

## 🌐 Overview

BlockPress is designed as a **headless-ready, extensible CMS** where content is no longer stored as HTML, but as structured **block trees**.

Instead of editing rich text, everything is built using reusable blocks.

---

## ✨ Key Features

### 🧱 Block-Based Page Builder

- Drag & drop editor (powered by `dnd-kit`)
- Nested block structure (tree system)
- Real-time editing canvas
- Sidebar block library
- Block inspector (property editor)

Supported blocks:

- Text
- Paragraph
- Heading
- Image
- Button
- List
- Quote
- Code

Fully extensible → custom block types can be added easily.

---

### 🧠 Modern Content Architecture

- Posts separated from Blocks (normalized relational design)
- Recursive parent-child block structure
- JSON-based props & styles per block
- Translation-ready (`block_translations`)
- Order-based drag & drop system

---

### 🗂️ CMS Features (Like WordPress)

- Post Management (Create / Edit / Delete)
- Draft / Publish / Trash system
- Soft delete (recycle bin support)
- Slug auto-generation
- Featured image (meta system)
- Category & Tag system (Taxonomy-based)

---

### 🔐 RBAC (Role-Based Access Control)

- Admin / Editor / Author roles
- Permission-based access system
- Secure dashboard control

---

### ⚡ Backend (Laravel 13)

- Clean Service Layer Architecture (`PostService`)
- Transaction-safe operations
- Recursive block storage engine
- Taxonomy relationship system
- Meta system for flexible content extension

---

### 🎨 Frontend (React + Inertia.js)

- Inertia.js SPA-like experience
- React-based block editor
- TailwindCSS UI system
- Live preview editing
- Sidebar + Canvas + Inspector layout
- Dynamic block rendering system

---

## 🧩 Architecture Overview

---

## 🔄 WordPress Featured Image Migration

This project includes a dedicated Artisan command to migrate WordPress featured images to Laravel posts, converting file paths into S3-compatible paths (specifically for IDCloudHost).

### Required Environment Variables

Ensure the following variables are configured in your `.env` file:

```env
# IDCloudHost Storage URL & Media Prefix
IDCH_URL=https://is3.cloudhost.id/arumiflorist-assets
IDCH_MEDIA_PREFIX=media

# WordPress Database Connection
WP_DB_HOST=127.0.0.1
WP_DB_PORT=3306
WP_DB_DATABASE=wordpress_database
WP_DB_USERNAME=root
WP_DB_PASSWORD=password
WP_DB_PREFIX=wp_
```

### Command Usage

#### For CMS Posts
##### 1. Dry Run (Preview Changes)
Inspect which posts will be matched and updated without writing any changes to the database:
```bash
php artisan wp:migrate-featured-images --dry-run
```

##### 2. Execute Migration (Default)
Executes the migration. Matches WordPress posts with Laravel posts by the `wp_id` column, falling back to wordpress_migration_maps or slug matching:
```bash
php artisan wp:migrate-featured-images
```

##### 3. Match Strictly by Slug
Force matching Laravel posts strictly using the WordPress post slug (`post_name`):
```bash
php artisan wp:migrate-featured-images --match=slug
```

##### 4. Custom WordPress Table Prefix
Specify a different prefix for WordPress database tables (default is `wp_`):
```bash
php artisan wp:migrate-featured-images --wp-prefix=wpzo_ --dry-run
```

##### 5. Custom S3 Path Prefix
Change the default prefix prepended to S3 paths (default is `media`):
```bash
php artisan wp:migrate-featured-images --s3-prefix=media
```

#### For WooCommerce Products
##### 1. Dry Run (Preview Changes)
Inspect which products will be matched and updated without writing any changes to the database:
```bash
php artisan wp:migrate-product-featured-images --dry-run
```

##### 2. Execute Migration (Default)
Executes the migration. Matches WooCommerce products with Laravel products by the `wp_id` column, falling back to wordpress_migration_maps (where type is `woo_product`) or slug matching:
```bash
php artisan wp:migrate-product-featured-images
```

##### 3. Match Strictly by Slug
Force matching Laravel products strictly using the WordPress product slug (`post_name`):
```bash
php artisan wp:migrate-product-featured-images --match=slug
```

##### 4. Custom WordPress Table Prefix
Specify a different prefix for WordPress database tables (default is `wp_`):
```bash
php artisan wp:migrate-product-featured-images --wp-prefix=wpzo_ --dry-run
```

##### 5. Custom S3 Path Prefix
Change the default prefix prepended to S3 paths (default is `media`):
```bash
php artisan wp:migrate-product-featured-images --s3-prefix=media
```
