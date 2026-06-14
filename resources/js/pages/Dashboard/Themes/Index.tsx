import { Head, Link, router, useForm } from '@inertiajs/react';
import { BookOpen, Eye, LoaderCircle, Palette, Trash2, Upload } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';

import {
    activate as activateTheme,
    customize as customizeTheme,
    destroy as destroyTheme,
    store as storeTheme,
    usageGuide as usageGuideTheme,
} from '@/actions/App/Http/Controllers/Dashboard/ThemeController';
import { preview } from '@/actions/App/Http/Controllers/Frontend/HomeController';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { usePermission } from '@/lib/permissions';

interface ThemeItem {
    id: number;
    name: string;
    slug: string;
    version: string | null;
    author: string | null;
    description: string | null;
    screenshot: string | null;
    is_installed: boolean;
    is_active: boolean;
    supports: string[];
    settings_count: number;
    has_settings: boolean;
}

interface Props {
    themes: ThemeItem[];
}

export default function Index({ themes }: Props) {
    const { hasPermission } = usePermission();
    const canUpload = hasPermission('themes.create');
    const canEdit = hasPermission('themes.edit');
    const canDelete = hasPermission('themes.delete');
    const [deletingTheme, setDeletingTheme] = useState<ThemeItem | null>(null);

    const {
        data,
        setData,
        post,
        processing,
        progress,
        errors,
        reset,
    } = useForm<{ archive: File | null }>({
        archive: null,
    });

    const submitUpload = (event: FormEvent) => {
        event.preventDefault();
        post(storeTheme().url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const handleActivate = (theme: ThemeItem) => {
        router.post(activateTheme(theme.slug).url, undefined, {
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (! deletingTheme) {
            return;
        }

        router.delete(destroyTheme(deletingTheme.slug).url, {
            preserveScroll: true,
            onFinish: () => setDeletingTheme(null),
        });
    };

    return (
        <>
            <Head title="Theme Manager" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Theme Manager
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Kelola theme frontend terpisah dari dashboard core. ZIP theme hanya
                            membawa Blade view, asset final hasil build, dan manifest.
                        </p>
                        <div className="mt-4">
                            <Link href={usageGuideTheme().url}>
                                <Button variant="outline" className="gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Cara Penggunaan
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {canUpload && (
                        <form
                            onSubmit={submitUpload}
                            className="flex w-full flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm xl:max-w-xl"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium">Upload Theme ZIP</p>
                                    <p className="text-xs text-muted-foreground">
                                        CMS tidak akan menjalankan npm, composer, atau provider theme.
                                    </p>
                                </div>
                                {progress && (
                                    <Badge variant="secondary">{progress.percentage}%</Badge>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Input
                                    type="file"
                                    accept=".zip,application/zip"
                                    onChange={(event) =>
                                        setData('archive', event.target.files?.[0] ?? null)
                                    }
                                />
                                <Button
                                    type="submit"
                                    disabled={processing || ! data.archive}
                                    className="gap-2"
                                >
                                    {processing ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="h-4 w-4" />
                                    )}
                                    Upload Theme
                                </Button>
                            </div>

                            {errors.archive && (
                                <p className="text-sm text-destructive">{errors.archive}</p>
                            )}
                            {errors.theme && (
                                <p className="text-sm text-destructive">{errors.theme}</p>
                            )}
                        </form>
                    )}
                </div>

                <hr className="border-border" />

                <div className="grid gap-6 xl:grid-cols-2">
                    {themes.map((theme) => (
                        <Card key={theme.id} className="overflow-hidden">
                            <div className="grid gap-0 md:grid-cols-[240px_1fr]">
                                <div className="border-b bg-muted/20 md:border-r md:border-b-0">
                                    {theme.screenshot ? (
                                        <img
                                            src={theme.screenshot}
                                            alt={`${theme.name} preview`}
                                            className="h-full min-h-56 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex min-h-56 items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-sm text-muted-foreground dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
                                            No screenshot
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <CardHeader className="space-y-3">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <CardTitle className="text-xl">{theme.name}</CardTitle>
                                                <CardDescription className="mt-1">
                                                    <span className="font-mono text-xs">{theme.slug}</span>
                                                    {' • '}
                                                    {theme.version || 'no version'}
                                                    {' • '}
                                                    {theme.author || 'Unknown author'}
                                                </CardDescription>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant={theme.is_active ? 'default' : 'secondary'}>
                                                    {theme.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                                {theme.has_settings && (
                                                    <Badge variant="outline">
                                                        {theme.settings_count} saved settings
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                            {theme.description || 'Theme ini belum punya deskripsi.'}
                                        </p>
                                    </CardHeader>

                                    <CardContent className="flex flex-1 flex-col justify-between gap-5">
                                        <div className="space-y-3">
                                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                                Supports
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {theme.supports.length > 0 ? (
                                                    theme.supports.map((item) => (
                                                        <Badge key={item} variant="outline">
                                                            {item}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        Tidak ada deklarasi support di manifest.
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <a
                                                href={preview(theme.slug).url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <Button variant="outline" className="gap-2">
                                                    <Eye className="h-4 w-4" />
                                                    Preview
                                                </Button>
                                            </a>

                                            {canEdit && (
                                                <>
                                                    <Button
                                                        onClick={() => handleActivate(theme)}
                                                        disabled={theme.is_active}
                                                    >
                                                        {theme.is_active ? 'Theme Active' : 'Activate'}
                                                    </Button>

                                                    <Link href={customizeTheme(theme.slug).url}>
                                                        <Button variant="secondary" className="gap-2">
                                                            <Palette className="h-4 w-4" />
                                                            Customize
                                                        </Button>
                                                    </Link>
                                                </>
                                            )}

                                            {canDelete && (
                                                <Button
                                                    variant="destructive"
                                                    className="gap-2"
                                                    disabled={theme.is_active}
                                                    onClick={() => setDeletingTheme(theme)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {themes.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="py-14 text-center text-sm text-muted-foreground">
                            Belum ada theme terdaftar. Upload ZIP theme atau gunakan starter theme
                            bawaan di folder <span className="font-mono">themes/starter-creative</span>.
                        </CardContent>
                    </Card>
                )}
            </div>

            <AlertDialog open={!!deletingTheme} onOpenChange={(open) => ! open && setDeletingTheme(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus theme?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Theme <strong>{deletingTheme?.name}</strong> akan dihapus dari database,
                            folder theme, dan asset publiknya.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Hapus Theme</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

Index.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Themes', href: '/my-admin/dashboard/themes' }]}>
        {page}
    </AppLayout>
);
