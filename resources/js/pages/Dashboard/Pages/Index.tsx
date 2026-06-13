import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type React from 'react';
import { toast } from 'sonner';

import {
    create as createPage,
    destroy as destroyPage,
    edit as editPage,
} from '@/actions/App/Http/Controllers/Dashboard/PageController';
import { edit as editPageTranslation } from '@/actions/App/Http/Controllers/Dashboard/Cms/PageTranslationController';
import { DataTable } from '@/components/DataTable';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { usePermission } from '@/lib/permissions';
import type { LaravelPagination } from '@/types/LaravelPagination';

interface Page {
    id: number;
    title: string;
    slug: string;
    status: string;
    translations?: Array<{
        language_id: number;
    }>;
    creator?: {
        name: string;
    } | null;
}

interface LanguageOption {
    id: number;
    code: string;
    name: string | null;
}

interface Props {
    pages: LaravelPagination<Page>;
    filters: {
        search?: string;
        status?: string;
    };
    enabledLanguages: LanguageOption[];
    defaultLanguage?: {
        id: number;
        code: string;
        english_name: string | null;
    } | null;
}

export default function Index({
    pages,
    filters,
    enabledLanguages,
    defaultLanguage,
}: Props) {
    const { hasPermission } = usePermission();
    const canCreate = hasPermission('pages.create');
    const canEdit = hasPermission('pages.edit');
    const canDelete = hasPermission('pages.delete');
    const canTranslate = hasPermission('pages.translate');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [languageByPageId, setLanguageByPageId] = useState<
        Record<number, number>
    >(() => {
        const fallbackLanguageId =
            defaultLanguage?.id ?? enabledLanguages[0]?.id ?? 0;

        return pages.data.reduce<Record<number, number>>((carry, page) => {
            const translatedLanguageId = page.translations?.[0]?.language_id;

            carry[page.id] = translatedLanguageId ?? fallbackLanguageId;

            return carry;
        }, {});
    });
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        status: filters.status || 'all',
    });

    const applyFilter = () => {
        get('/my-admin/dashboard/pages', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(destroyPage(deletingId).url, {
            preserveScroll: true,
            onStart: () => toast.loading('Deleting...', { id: 'delete' }),
            onSuccess: () =>
                toast.success('Deleted successfully!', { id: 'delete' }),
            onError: () => toast.error('Failed to delete!', { id: 'delete' }),
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        {
            label: 'ID',
            render: (row: Page) => row.id,
        },
        {
            label: 'Title',
            render: (row: Page) => (
                <div>
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-muted-foreground">
                        /{row.slug}
                    </div>
                </div>
            ),
        },
        {
            label: 'Author',
            render: (row: Page) => row.creator?.name ?? '-',
        },
        {
            label: 'Status',
            render: (row: Page) => (
                <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                        row.status === 'publish'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                            : row.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                >
                    {row.status}
                </span>
            ),
        },
        {
            label: 'Action',
            render: (row: Page) => (
                <div className="flex flex-wrap gap-2">
                    {canEdit && (
                        <Link href={editPage(row.id).url}>
                            <Button size="sm" variant="secondary">
                                Edit
                            </Button>
                        </Link>
                    )}

                    {canDelete && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setDeletingId(row.id)}
                                >
                                    Delete
                                </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Are you sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This page will be moved to soft delete.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {canTranslate && enabledLanguages.length > 0 && (
                        <>
                            <Select
                                value={String(languageByPageId[row.id] ?? '')}
                                onValueChange={(value) =>
                                    setLanguageByPageId((previous) => ({
                                        ...previous,
                                        [row.id]: Number(value),
                                    }))
                                }
                            >
                                <SelectTrigger className="h-8 w-24 text-xs">
                                    <SelectValue placeholder="Lang" />
                                </SelectTrigger>
                                <SelectContent>
                                    {enabledLanguages.map((language) => (
                                        <SelectItem
                                            key={language.id}
                                            value={String(language.id)}
                                        >
                                            {language.code.toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const selectedLanguageId =
                                        languageByPageId[row.id] ??
                                        enabledLanguages[0]?.id;

                                    if (!selectedLanguageId) {
                                        return;
                                    }

                                    router.visit(
                                        editPageTranslation({
                                            page: row.id,
                                            language: selectedLanguageId,
                                        }).url,
                                    );
                                }}
                            >
                                Translate
                            </Button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    const statusFilters = ['publish', 'draft', 'archived', 'all'];

    return (
        <>
            <Head title="Pages" />

            <div className="container mx-auto space-y-6 px-6 py-10">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Pages</h1>
                        <p className="text-muted-foreground">
                            Manage frontend static and dynamic pages
                        </p>
                    </div>

                    {canCreate && (
                        <Link href={createPage().url}>
                            <Button>Add Page</Button>
                        </Link>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex gap-3">
                        <Input
                            placeholder="Search title or slug..."
                            value={data.search}
                            onChange={(event) =>
                                setData('search', event.target.value)
                            }
                        />

                        <Button onClick={applyFilter} disabled={processing}>
                            Apply
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {statusFilters.map((status) => (
                            <Button
                                key={status}
                                type="button"
                                size="sm"
                                variant={
                                    data.status === status
                                        ? 'default'
                                        : 'outline'
                                }
                                onClick={() => {
                                    setData('status', status);
                                    setTimeout(applyFilter, 50);
                                }}
                            >
                                {status.toUpperCase()}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl bg-card p-6 shadow">
                    <DataTable<Page> data={pages.data} columns={columns} />
                </div>

                <div className="flex flex-wrap gap-2">
                    {pages.links.map((link, index) => (
                        <button
                            key={index}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded border px-3 py-1 ${
                                link.active
                                    ? 'bg-primary text-white'
                                    : 'bg-card'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Pages', href: '/my-admin/dashboard/pages' }]}>
        {page}
    </AppLayout>
);
