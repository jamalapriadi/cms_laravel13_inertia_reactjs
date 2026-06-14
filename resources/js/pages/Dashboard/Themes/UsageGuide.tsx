import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BadgeInfo, BookOpen, Box, Hammer, Upload } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as themesIndex } from '@/actions/App/Http/Controllers/Dashboard/ThemeController';

interface Props {
    appUrl: string;
}

export default function UsageGuide({ appUrl }: Props) {
    const previewExample = `${appUrl}/theme-preview/modern-store`;

    return (
        <>
            <Head title="Cara Penggunaan Theme" />

            <div className="container mx-auto max-w-6xl space-y-6 px-6 py-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                            <BookOpen className="h-3.5 w-3.5" />
                            Dokumentasi Theme Manager
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Cara Penggunaan Starter Theme untuk Development
                        </h1>
                        <p className="max-w-3xl text-sm text-muted-foreground">
                            Panduan ini menjelaskan alur membuat theme baru dari
                            <span className="mx-1 font-mono">starter-creative</span>
                            sampai build asset final untuk upload ke CMS.
                        </p>
                    </div>

                    <Link href={themesIndex().url}>
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Theme Manager
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>1. Copy Starter Theme Jadi Theme Baru</CardTitle>
                        <CardDescription>
                            Gunakan starter bawaan sebagai base agar struktur runtime dan source development sudah siap.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                            <code>{`cp -R themes/starter-creative themes/modern-store`}</code>
                        </pre>
                        <p className="text-sm text-muted-foreground">
                            Setelah itu, theme baru kamu akan berada di folder
                            <span className="mx-1 font-mono">themes/modern-store</span>.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2. Ubah Manifest Theme</CardTitle>
                        <CardDescription>
                            File <span className="font-mono">theme.json</span> harus diubah supaya theme baru punya identitas dan namespace sendiri.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>1. Ubah nilai <span className="font-mono">name</span>.</p>
                        <p>2. Ubah nilai <span className="font-mono">slug</span>.</p>
                        <p>3. Ubah <span className="font-mono">description</span>.</p>
                        <p>
                            4. Ubah semua mapping template dari
                            <span className="mx-1 font-mono">starter-creative::...</span>
                            menjadi
                            <span className="mx-1 font-mono">modern-store::...</span>.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>3. Discover Theme di CMS</CardTitle>
                        <CardDescription>
                            Setelah folder dan manifest siap, jalankan discover supaya theme baru muncul di Theme Manager.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                            <code>{`php artisan cms:themes:discover`}</code>
                        </pre>
                        <p className="text-sm text-muted-foreground">
                            Jika theme belum terlihat, jalankan juga:
                        </p>
                        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                            <code>{`php artisan optimize:clear`}</code>
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>4. Preview Theme Baru</CardTitle>
                        <CardDescription>
                            Gunakan preview sebelum aktivasi supaya bisa cek tampilan frontend tanpa mengubah theme aktif.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                            <code>{previewExample}</code>
                        </pre>
                        <p className="text-sm text-muted-foreground">
                            Ganti <span className="font-mono">modern-store</span> dengan slug theme yang kamu buat.
                        </p>
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Hammer className="h-5 w-5 text-primary" />
                                <CardTitle>5. Development Mode Theme</CardTitle>
                            </div>
                            <CardDescription>
                                Semua workflow frontend theme dilakukan dari folder
                                <span className="mx-1 font-mono">source</span>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                                <code>{`cd themes/modern-store/source
npm install
npm run dev`}</code>
                            </pre>
                            <p className="text-sm text-muted-foreground">
                                Mode ini akan menjalankan TailwindCSS v4 watcher dan Vite JS bundler secara paralel.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Box className="h-5 w-5 text-primary" />
                                <CardTitle>6. File yang Biasanya Diedit</CardTitle>
                            </div>
                            <CardDescription>
                                Edit area berikut sesuai kebutuhan layout, styling, dan interaksi theme.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>1. <span className="font-mono">resources/views</span> untuk Blade runtime CMS.</p>
                            <p>2. <span className="font-mono">source/css/input.css</span> untuk TailwindCSS v4.</p>
                            <p>3. <span className="font-mono">source/js/theme.js</span> untuk GSAP, TextPlugin, dan SwiperJS.</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>7. Build Asset Final Sebelum Upload</CardTitle>
                        <CardDescription>
                            CMS hanya menggunakan asset final di folder public theme. Jangan upload theme yang belum dibuild.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                            <code>{`cd themes/modern-store/source
npm run build`}</code>
                        </pre>
                        <p className="text-sm text-muted-foreground">
                            Pastikan file berikut sudah terisi:
                        </p>
                        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                            <code>{`themes/modern-store/public/css/output.css
themes/modern-store/public/js/theme.js`}</code>
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-primary" />
                            <CardTitle>8. ZIP dan Upload ke Theme Manager</CardTitle>
                        </div>
                        <CardDescription>
                            Untuk upload production, sertakan manifest, Blade views, dan asset final saja.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                            <code>{`cd themes
zip -r modern-store.zip modern-store \\
  -x "modern-store/source/node_modules/*" \\
  -x "modern-store/.git/*" \\
  -x "modern-store/.DS_Store"`}</code>
                        </pre>
                        <p className="text-sm text-muted-foreground">
                            Build dilakukan di lokal developer machine atau CI, bukan di server production CMS.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BadgeInfo className="h-5 w-5 text-primary" />
                            <CardTitle>Catatan Penting</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>1. Runtime theme tidak memakai <span className="font-mono">@vite()</span>.</p>
                        <p>2. Asset dipanggil lewat helper <span className="font-mono">theme_asset()</span> dan <span className="font-mono">theme_assets()</span>.</p>
                        <p>3. Runtime CMS hanya butuh <span className="font-mono">theme.json</span>, <span className="font-mono">resources/views</span>, dan <span className="font-mono">public</span>.</p>
                        <p>4. Jangan sertakan <span className="font-mono">source/node_modules</span> di theme yang akan didiscover atau di-upload.</p>
                        <p>5. Jika data posts, products, atau categories kosong, starter theme tetap aman dan menampilkan empty state.</p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

UsageGuide.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Themes', href: '/my-admin/dashboard/themes' },
            {
                title: 'Cara Penggunaan',
                href: '/my-admin/dashboard/themes/usage-guide',
            },
        ]}
    >
        {page}
    </AppLayout>
);
