# WordPress to Laravel CMS Database Mapping

This document details how data from a standard WordPress database is mapped and migrated into the Laravel CMS tables of the **safartranss.com** application.

---

## 1. Categories Mapping

### Source Data:
- **Source Query**: `wp_terms` joined with `wp_term_taxonomy` where `taxonomy = 'category'`
- **Parent-Child Relation**: `wp_term_taxonomy.parent`

### Target Model: `App\Models\PostCategory` (Table: `post_categories`)

| WordPress Source Field | Laravel Target Field | Data Type | Transformation / Fallback |
| :--- | :--- | :--- | :--- |
| `term_id` | *(Mapped via tracking)* | Integer | Stored in `wordpress_migration_maps` |
| `name` | `category_name` | String | Direct copy |
| `slug` | `slug` | String | Normalized, suffix added if slug conflict occurs |
| `description` | `description` | Text | Direct copy |
| `parent` | `parent_id` | UUID | Resolved using `wordpress_migration_maps` of the parent term ID |
| *(None)* | `id` | UUID | Generated dynamically on creation |
| *(None)* | `user_id` | UUID | Null |
| *(None)* | `featured_image` | String | Null |

---

## 2. Tags Mapping

### Source Data:
- **Source Query**: `wp_terms` joined with `wp_term_taxonomy` where `taxonomy = 'post_tag'`

### Target Models: `App\Models\Term` & `App\Models\TermTaxonomy` (Tables: `terms`, `term_taxonomy`)

| WordPress Source Field | Laravel Target Field | Data Type | Transformation / Fallback |
| :--- | :--- | :--- | :--- |
| `term_id` | *(Mapped via tracking)* | Integer | Stored in `wordpress_migration_maps` |
| `name` | `terms.name` | String | Direct copy |
| `slug` | `terms.slug` | String | Normalized, suffix added if slug conflict occurs |
| `description` | `term_taxonomy.description` | Text | Direct copy |
| *(None)* | `term_taxonomy.taxonomy` | String | Constant `'tags'` |
| *(None)* | `term_taxonomy.count` | Integer | Initialized to `0`, updated when posts are linked |

---

## 3. Media Mapping

### Source Data:
- **Source Query**: `wp_posts` where `post_type = 'attachment'`
- **Alt Text**: Meta key `_wp_attachment_image_alt` from `wp_postmeta`
- **File Path**: Meta key `_wp_attached_file` from `wp_postmeta`

### Target Model: `App\Models\Dashboard\Media` (Table: `media`)

| WordPress Source Field | Laravel Target Field | Data Type | Transformation / Fallback |
| :--- | :--- | :--- | :--- |
| `ID` | *(Mapped via tracking)* | Integer | Stored in `wordpress_migration_maps` |
| `post_title` | `name` | String | Direct copy |
| `_wp_attached_file` | `file_name` | String | Basename of the file |
| `_wp_attached_file` | `path` | String | Path relative to `public` disk |
| `post_mime_type` | `mime_type` | String | Direct copy |
| `_wp_attachment_image_alt`| `alt` | String | Direct copy |
| *(None)* | `id` | UUID | Generated dynamically on creation |
| *(None)* | `uuid` | UUID | Generated dynamically on creation |
| *(None)* | `disk` | String | Constant `'public'` |
| *(None)* | `size` | Integer | Null |

---

## 4. Posts Mapping

### Source Data:
- **Source Query**: `wp_posts` where `post_type = 'post'` and `post_status` in `('publish', 'draft', 'private', 'pending')`
- **Category Relation**: `wp_term_relationships` matching category terms
- **Tag Relation**: `wp_term_relationships` matching tag terms
- **Featured Image ID**: Meta key `_thumbnail_id` from `wp_postmeta`

### Target Model: `App\Models\Post` (Table: `posts`) & `App\Models\PostTranslation` (Table: `post_translations`)

#### Base Table (`posts`)
| WordPress Source Field | Laravel Target Field | Data Type | Transformation / Fallback |
| :--- | :--- | :--- | :--- |
| `ID` | *(Mapped via tracking)* | Integer | Stored in `wordpress_migration_maps` |
| `post_title` | `title` | String | Direct copy |
| `post_name` | `slug` | String | Fallback to title slug; appends unique suffix if conflict |
| `post_content` | `content` | LongText | Encoded as simple editor block JSON |
| `post_status` | `status` | String | `publish` -> `publish`, others -> `draft` |
| `post_date` | `published_at` | DateTime | Mapped if published |
| `post_author` | `user_id` | Integer | Map to local User ID matching WordPress ID/email; fallback to default admin |
| *(None)* | `type` | String | Constant `'post'` |

#### Translation Table (`post_translations`)
A translation entry is automatically created for the system's default language.

| Laravel Base Field | Laravel Translation Field | Transformation / Fallback |
| :--- | :--- | :--- |
| `post.id` | `post_id` | Linked foreign key |
| `default_language_id` | `language_id` | System's default language ID |
| `title` | `title` | Copy of title |
| `slug` | `slug` | Copy of slug |
| `content` | `content` | Copy of JSON block content |
| `status` | `status` | Copy of status |
| `published_at` | `published_at` | Copy of published_at |

#### Relationships & Meta
- **Category ID**: In WordPress, post categories are stored in `wp_term_relationships`. In Laravel, the post is associated with a category by writing a `post_meta` record:
  - `meta_key = 'post_category_id'`
  - `meta_value = [Laravel PostCategory UUID]`
- **Featured Image**: In WordPress, meta key `_thumbnail_id` points to the attachment ID. We lookup the Laravel `Media` mapping for that attachment ID, extract the path, and write a `post_meta` record:
  - `meta_key = 'featured_image'`
  - `meta_value = [Media Path]`
- **Post Tags**: WordPress tags from `wp_term_relationships` are mapped to local `term_taxonomy.id` (where taxonomy is `'tags'`) and stored in the Laravel `term_relationships` pivot table.

---

## 5. Pages Mapping

### Source Data:
- **Source Query**: `wp_posts` where `post_type = 'page'` and `post_status` in `('publish', 'draft', 'private', 'pending')`
- **Featured Image ID**: Meta key `_thumbnail_id` from `wp_postmeta`

### Target Model: `App\Models\Page` (Table: `pages`) & `App\Models\PageTranslation` (Table: `page_translations`)

#### Base Table (`pages`)
| WordPress Source Field | Laravel Target Field | Data Type | Transformation / Fallback |
| :--- | :--- | :--- | :--- |
| `ID` | *(Mapped via tracking)* | Integer | Stored in `wordpress_migration_maps` |
| `post_title` | `title` | String | Direct copy |
| `post_name` | `slug` | String | Suffix added if conflict occurs |
| `post_excerpt` | `excerpt` | Text | Direct copy |
| `post_content` | `content` | LongText | Encoded as simple editor block JSON |
| `post_status` | `status` | String | `publish` -> `publish`, others -> `draft` |
| `post_date` | `published_at` | DateTime | Mapped if published |
| `post_author` | `created_by` | Integer | Map to local User ID matching WordPress ID/email; fallback to default admin |
| `post_modified` | `updated_at` | DateTime | Direct copy |
| `_thumbnail_id` meta | `featured_image` | String | Lookup media path using `wordpress_migration_maps` |
| `_yoast_wpseo_title` | `seo_title` | String | Yoast or RankMath SEO Title |
| `_yoast_wpseo_metadesc`| `seo_description` | Text | Yoast or RankMath SEO Description |

#### Translation Table (`page_translations`)
Created for the system's default language.

| Laravel Base Field | Laravel Translation Field | Transformation / Fallback |
| :--- | :--- | :--- |
| `page.id` | `page_id` | Linked foreign key |
| `default_language_id` | `language_id` | System's default language ID |
| `title` | `title` | Copy of title |
| `slug` | `slug` | Copy of slug |
| `excerpt` | `excerpt` | Copy of excerpt |
| `content` | `content` | Copy of content |
| `status` | `status` | Copy of status |
| `published_at` | `published_at` | Copy of published_at |
| `seo_title` | `seo_title` | Copy of seo_title |
| `seo_description` | `seo_description` | Copy of seo_description |

---

## 6. Duplicate Handling & Idempotency

### Tracking Table: `wordpress_migration_maps`
This table records every migrated resource to prevent duplicate entries and allow updates:
- Unique index on `(wordpress_id, wordpress_type)` guarantees that any WordPress resource corresponds to exactly one Laravel resource.
- When running the migrator, we check if a mapping exists.
  - If **exists**: We update the existing target record.
  - If **not exists**: We create a new target record and insert a new mapping entry.
