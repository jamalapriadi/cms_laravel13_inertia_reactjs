# WordPress WooCommerce Category Image Migration

This documentation explains how to configure and use the `categories:migrate-wordpress-images` Artisan command to migrate category thumbnail images from a WordPress/WooCommerce database into the Laravel application.

---

## Configuration

In your `.env` file, configure the WordPress connection credentials and prefix:

```env
# WordPress Connection Credentials (configured in config/database.php)
WP_DB_HOST=127.0.0.1
WP_DB_PORT=3306
WP_DB_DATABASE=your_wordpress_db
WP_DB_USERNAME=root
WP_DB_PASSWORD=your_password
WP_DB_PREFIX=wpzo_ # The prefix of your WordPress database tables
```

### Image URL Resolution Setup

The command supports different modes of resolving the final category image path/URL:

#### Option 1: WordPress Content Uploads URL (Full URL)

Add the `WORDPRESS_UPLOADS_URL` variable in your `.env` file to build a full URL pointing to the WordPress upload directory.

```env
WORDPRESS_UPLOADS_URL=https://example.com/wp-content/uploads
```

*Example Transformation:*
- WordPress attached file: `2024/05/category-image.jpg`
- Laravel target image field: `https://example.com/wp-content/uploads/2024/05/category-image.jpg`

#### Option 2: Local Object Storage Relative Path (Default)

If `WORDPRESS_UPLOADS_URL` is **not set**, the command defaults to saving a relative path starting with `/uploads/` (omitting the global object storage base URL `https://is3.cloudhost.id/...`).

*Example Transformation:*
- WordPress attached file: `2024/05/category-image.jpg`
- Laravel target image field: `/uploads/2024/05/category-image.jpg`

You can customize the prefix (which defaults to `uploads`) by using the `--s3-prefix` option.

---

## How to Run the Migration Command

### 1. Preview Changes (Dry Run)

Always run a dry run preview first to check how many records will be updated and check for any mismatch errors:

```bash
php artisan categories:migrate-wordpress-images --dry-run
```

### 2. Run Only for Missing Images

If you only want to migrate images for Laravel categories that do not already have an image set (where `image` is null or empty):

```bash
php artisan categories:migrate-wordpress-images --only-missing
```

### 3. Fallback Matching by Category Name

By default, the command matches WordPress categories to Laravel categories using the slug (`wp_terms.slug` matched to `categories.slug`). If you want to fall back to matching by name if a slug match is not found:

```bash
php artisan categories:migrate-wordpress-images --fallback-name
```

### 4. Running in Production

To run in the production environment, the `--force` option is required:

```bash
php artisan categories:migrate-wordpress-images --force
```

### 5. Limit Records to Process

To test with a subset of categories, use the `--limit` option:

```bash
php artisan categories:migrate-wordpress-images --limit=5 --dry-run
```

---

## Full List of Available Options

| Option | Description |
| :--- | :--- |
| `--dry-run` | Preview what will be updated without writing to the Laravel database. |
| `--force` | Required to run the migration in the production environment. |
| `--only-missing` | Only update Laravel categories where the `image` field is null or empty. |
| `--limit=` | Limit the number of WordPress categories to be processed. |
| `--fallback-name` | Try matching categories by name (`wp_terms.name` to `categories.name`) as a fallback if slug match fails. |
| `--wp-prefix=` | Overwrite/specify the WordPress table prefix (defaults to `WORDPRESS_TABLE_PREFIX` env or `wpzo_`). |
| `--wp-uploads-url=`| Overwrite/specify a custom WordPress uploads URL (overrides `WORDPRESS_UPLOADS_URL` env). |
| `--s3-prefix=` | S3 prefix to prepend to the media path (defaults to `media`). |
| `--relative` | Save the image as a relative path instead of a full URL when resolving using object storage configuration. |
