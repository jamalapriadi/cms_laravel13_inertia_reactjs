# Laravel Inertia Block Editor

Reusable Laravel package untuk block editor berbasis Inertia + React. Package ini menyediakan:

- Migration polymorphic `content_blocks`
- Trait `HasBlocks` untuk model seperti `Post`, `Page`, atau model lain
- Service `BlockTreeService` untuk simpan dan load nested block tree
- Validation rule `ValidBlocks`
- Optional JSON controller route
- React component publishable: `BlockBuilder`, `BlockRenderer`, `BlockEditor`, `StructureTree`
- Basic blocks: Heading, Paragraph, Rich Editor, Image, Button, Icon, Divider, Spacer
- Layout blocks: Section, Container, Grid, Columns, Flex Row, Flex Column, Card, Tabs, Accordion, Slider

## 1. Install

Untuk development lokal:

```bash
composer config repositories.inertia-block-editor path packages/jamstackid/laravel-inertia-block-editor
composer require jamstackid/laravel-inertia-block-editor:@dev
```

Jika sudah dipublish ke GitHub/Packagist:

```bash
composer require jamstackid/laravel-inertia-block-editor
```

Install dependency React yang dibutuhkan di project host:

```bash
npm install @dnd-kit/core @dnd-kit/sortable lucide-react
```

## 2. Publish Config, Migration, Dan React Assets

```bash
php artisan vendor:publish --tag=inertia-block-editor-config
php artisan vendor:publish --tag=inertia-block-editor-migrations
php artisan vendor:publish --tag=inertia-block-editor-react
php artisan migrate
```

React assets akan masuk ke:

```txt
resources/js/vendor/inertia-block-editor
```

## 3. Schema Migration

Package memakai table polymorphic agar block bisa dipasang ke banyak model.

```php
Schema::create(config('inertia-block-editor.table', 'content_blocks'), function (Blueprint $table) {
    $table->id();
    $table->morphs('blockable');
    $table->foreignId('parent_id')->nullable()->constrained(config('inertia-block-editor.table', 'content_blocks'))->cascadeOnDelete();
    $table->string('type');
    $table->json('props')->nullable();
    $table->json('styles')->nullable();
    $table->unsignedInteger('sort_order')->default(0);
    $table->timestamps();

    $table->index(['blockable_type', 'blockable_id', 'parent_id', 'sort_order'], 'content_blocks_tree_index');
});
```

Karena menggunakan `morphs`, schema ini kompatibel untuk:

- `Post`
- `Page`
- `Product`
- `LandingPage`
- custom model lain

## 4. Tambahkan Trait Ke Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use JamstackId\InertiaBlockEditor\Concerns\HasBlocks;

class Post extends Model
{
    use HasBlocks;
}
```

## 5. Validasi Request

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use JamstackId\InertiaBlockEditor\Rules\ValidBlocks;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'blocks' => ['nullable', new ValidBlocks],
            'status' => ['required', 'in:draft,publish'],
        ];
    }
}
```

`blocks` boleh dikirim sebagai array atau JSON string.

## 6. Simpan Dan Edit Dari Controller

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Post;
use Illuminate\Support\Str;
use Inertia\Inertia;
use JamstackId\InertiaBlockEditor\Services\BlockTreeService;

class PostController
{
    public function create()
    {
        return Inertia::render('Posts/Create');
    }

    public function store(StorePostRequest $request, BlockTreeService $blocks)
    {
        $data = $request->validated();

        $post = Post::create([
            'title' => $data['title'],
            'slug' => Str::slug($data['title']),
            'status' => $data['status'],
        ]);

        $blocks->sync($post, $data['blocks'] ?? []);

        return redirect()->route('posts.edit', $post);
    }

    public function edit(Post $post, BlockTreeService $blocks)
    {
        return Inertia::render('Posts/Edit', [
            'post' => $post,
            'blocks' => $blocks->tree($post),
        ]);
    }

    public function update(UpdatePostRequest $request, Post $post, BlockTreeService $blocks)
    {
        $data = $request->validated();

        $post->update([
            'title' => $data['title'],
            'status' => $data['status'],
        ]);

        $blocks->sync($post, $data['blocks'] ?? []);

        return redirect()->route('posts.edit', $post);
    }
}
```

## 7. Gunakan Di Inertia React Page

Contoh `resources/js/pages/Posts/Create.tsx`:

```tsx
import { useForm } from '@inertiajs/react';
import { BlockBuilder } from '@/vendor/inertia-block-editor';
import type { BlockInstance } from '@/vendor/inertia-block-editor';

export default function Create() {
    const { data, setData, post, processing } = useForm<{
        title: string;
        status: string;
        blocks: BlockInstance[];
    }>({
        title: '',
        status: 'draft',
        blocks: [],
    });

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                post('/posts');
            }}
            className="min-h-screen"
        >
            <header className="flex items-center gap-3 border-b p-4">
                <input
                    value={data.title}
                    onChange={(event) => setData('title', event.target.value)}
                    className="h-10 flex-1 rounded border px-3"
                    placeholder="Post title"
                />

                <button
                    disabled={processing}
                    className="rounded bg-black px-4 py-2 text-white"
                >
                    Save
                </button>
            </header>

            <BlockBuilder
                value={data.blocks}
                onChange={(blocks) => setData('blocks', blocks)}
                className="border-0"
            />
        </form>
    );
}
```

Contoh `Edit.tsx`:

```tsx
import { useForm } from '@inertiajs/react';
import { BlockBuilder } from '@/vendor/inertia-block-editor';
import type { BlockInstance } from '@/vendor/inertia-block-editor';

export default function Edit({
    post,
    blocks,
}: {
    post: any;
    blocks: BlockInstance[];
}) {
    const { data, setData, put, processing } = useForm({
        title: post.title,
        status: post.status,
        blocks,
    });

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                put(`/posts/${post.id}`);
            }}
        >
            <input
                value={data.title}
                onChange={(event) => setData('title', event.target.value)}
            />

            <BlockBuilder
                value={data.blocks}
                onChange={(nextBlocks) => setData('blocks', nextBlocks)}
            />

            <button disabled={processing}>Update</button>
        </form>
    );
}
```

## 8. Optional Generic Save Endpoint

Aktifkan di `config/inertia-block-editor.php`:

```php
'routes' => [
    'enabled' => true,
    'prefix' => 'dashboard/block-editor',
    'name' => 'block-editor.',
    'middleware' => ['web', 'auth'],
],

'blockables' => [
    'post' => App\Models\Post::class,
    'page' => App\Models\Page::class,
],
```

Lalu kirim request:

```ts
await fetch('/dashboard/block-editor/blocks', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN':
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? '',
    },
    body: JSON.stringify({
        blockable_type: 'post',
        blockable_id: 1,
        blocks,
    }),
});
```

## 9. Render Di Frontend Publik

```tsx
import { BlockRenderer } from '@/vendor/inertia-block-editor';
import type { BlockInstance } from '@/vendor/inertia-block-editor';

export default function Show({ blocks }: { blocks: BlockInstance[] }) {
    return (
        <main>
            {blocks.map((block) => (
                <BlockRenderer key={block.id} block={block} />
            ))}
        </main>
    );
}
```

## 10. Custom Block Types

Tambahkan type baru ke config:

```php
'allowed_types' => [
    // ...
    'hero-banner',
],
```

Lalu publish/edit React registry di:

```txt
resources/js/vendor/inertia-block-editor/editor/blocks/registry.ts
```

Tambahkan component block baru ke registry agar bisa dirender dan diedit.
