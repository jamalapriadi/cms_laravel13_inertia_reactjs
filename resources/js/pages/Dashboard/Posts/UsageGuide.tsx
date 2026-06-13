import { Head } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Props {
    apiBaseUrl: string;
}

export default function UsageGuide({ apiBaseUrl }: Props) {
    return (
        <>
            <Head title="Posts Usage Guide" />

            <div className="container mx-auto max-w-6xl space-y-6 px-6 py-8">
                <div className="space-y-2">
                    <Badge variant="outline">Documentation</Badge>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Cara Penggunaan Post & Translation
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Panduan alur pembuatan post, pengisian translation, dan
                        integrasi output content ke Blade, API, serta Next.js.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>1. Alur Membuat Post</CardTitle>
                        <CardDescription>
                            Langkah standar membuat konten utama (default
                            language) sebelum menerjemahkan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>1. Buka menu Dashboard &gt; Posts.</p>
                        <p>2. Klik tombol Add Post.</p>
                        <p>
                            3. Isi field utama seperti title, slug, status,
                            kategori, dan block content.
                        </p>
                        <p>4. Simpan post.</p>
                        <p>
                            5. Setelah tersimpan, post siap ditranslate per
                            bahasa di halaman list posts.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2. Alur Translation</CardTitle>
                        <CardDescription>
                            Translation dilakukan per post dan per bahasa.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>1. Pada tabel posts, pilih bahasa pada dropdown.</p>
                        <p>2. Klik tombol Translate.</p>
                        <p>
                            3. Isi field translation (title, excerpt, dan block
                            translation yang tersedia).
                        </p>
                        <p>
                            4. Klik Save Translation, sistem akan menyimpan ke
                            post_translations dan block_translations.
                        </p>
                        <p>
                            5. Ulangi untuk bahasa lain sesuai kebutuhan.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>3. Contoh Pemakaian di Blade</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                            <code>{`@php
    $locale = app()->getLocale();
    $translation = $post->translations
        ->firstWhere('language.code', strtoupper($locale));

    $title = $translation?->title ?? $post->title;
@endphp

<h1>{{ $title }}</h1>`}</code>
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>4. API Usage + JSON Example</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                            <code>{`GET ${apiBaseUrl}/posts/{slug}?locale=id`}</code>
                        </pre>
                        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                            <code>{`{
  "data": {
    "id": 1,
    "slug": "cara-membuat-auth",
    "title": "Cara Membuat Auth",
    "translation": {
      "language": "ID",
      "title": "Cara Membuat Auth",
      "excerpt": "Ringkasan konten",
      "blocks": [
        {
          "id": 11,
          "type": "rich-editor",
          "text": "Ini adalah cara untuk membuat autentikasi dan otorisasi"
        }
      ]
    }
  }
}`}</code>
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>5. Next.js Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                            <code>{`const res = await fetch(
  '${apiBaseUrl}/posts/cara-membuat-auth?locale=id',
  { next: { revalidate: 60 } }
);

const json = await res.json();
const post = json.data;

export default function PostDetail() {
  return <h1>{post.translation?.title ?? post.title}</h1>;
}`}</code>
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>6. Best Practice</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>1. Simpan post original lebih dulu sebelum translate.</p>
                        <p>
                            2. Gunakan fallback ke original content jika
                            translation belum tersedia.
                        </p>
                        <p>
                            3. Pertahankan struktur block antar bahasa agar
                            rendering frontend tetap konsisten.
                        </p>
                        <p>
                            4. Hindari hard delete post jika translation masih
                            dipakai di frontend.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>7. Catatan Teknis Tabel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>1. Tabel posts menyimpan konten default.</p>
                        <p>
                            2. Tabel post_translations menyimpan title/excerpt
                            per bahasa.
                        </p>
                        <p>
                            3. Tabel block_translations menyimpan hasil
                            translation untuk setiap block per bahasa.
                        </p>
                        <p>
                            4. Relasi post - blocks - block translations
                            digunakan saat render konten translated.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>8. Troubleshooting</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            1. Translation tidak muncul: pastikan bahasa aktif
                            dan translation untuk post tersebut sudah disimpan.
                        </p>
                        <p>
                            2. Konten masih bahasa default: cek fallback logic
                            di frontend/backend.
                        </p>
                        <p>
                            3. Block translation kosong: pastikan block original
                            memang ada pada post sebelum translate.
                        </p>
                        <p>
                            4. Data berubah tapi UI belum update: lakukan
                            refresh dan pastikan cache API tidak menyimpan
                            response lama.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

UsageGuide.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Posts', href: '/my-admin/dashboard/posts' },
            {
                title: 'Cara Penggunaan',
                href: '/my-admin/dashboard/posts/usage-guide',
            },
        ]}
    >
        {page}
    </AppLayout>
);
