import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { edit as editPostTranslation } from '@/actions/App/Http/Controllers/Dashboard/Cms/PostTranslationController';
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

import type { LaravelPagination } from '@/types/LaravelPagination';

interface Post {
    id: number;
    title: string;
    status: string;
    translations?: Array<{
        language_id: number;
    }>;
    author?: {
        name: string;
    };
}

interface LanguageOption {
    id: number;
    code: string;
    name: string | null;
}

interface Props {
    posts: LaravelPagination<Post>;
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
    posts,
    filters,
    enabledLanguages,
    defaultLanguage,
}: Props) {
    /**
     * FORM FILTER
     */
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        status: filters.status || 'publish',
    });

    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [languageByPostId, setLanguageByPostId] = useState<
        Record<number, number>
    >(() => {
        const fallbackLanguageId =
            defaultLanguage?.id ?? enabledLanguages[0]?.id ?? 0;

        return posts.data.reduce<Record<number, number>>((carry, post) => {
            const translatedLanguageId = post.translations?.[0]?.language_id;

            carry[post.id] = translatedLanguageId ?? fallbackLanguageId;

            return carry;
        }, {});
    });

    /**
     * APPLY FILTER
     */
    const applyFilter = () => {
        get('/dashboard/posts', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    /**
     * DELETE
     */
    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(`/dashboard/posts/${deletingId}`, {
            preserveScroll: true,
            onStart: () => toast.loading('Deleting...', { id: 'delete' }),
            onSuccess: () =>
                toast.success('Deleted successfully!', { id: 'delete' }),
            onError: () => toast.error('Failed to delete!', { id: 'delete' }),
            onFinish: () => setDeletingId(null),
        });
    };

    /**
     * TABLE
     */
    const columns = [
        {
            label: 'ID',
            render: (row: Post) => row.id,
        },
        {
            label: 'Title',
            render: (row: Post) => row.title,
        },
        {
            label: 'Author',
            render: (row: Post) => row.author?.name ?? '-',
        },
        {
            label: 'Status',
            render: (row: Post) => (
                <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                        row.status === 'publish'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                            : row.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                    }`}
                >
                    {row.status}
                </span>
            ),
        },
        {
            label: 'Action',
            render: (row: Post) => (
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/posts/${row.id}/edit`}>
                            <Button size="sm" variant="secondary">
                                Edit
                            </Button>
                        </Link>

                        {enabledLanguages.length > 0 && (
                            <>
                                <Select
                                    value={String(languageByPostId[row.id] ?? '')}
                                    onValueChange={(value) =>
                                        setLanguageByPostId((prev) => ({
                                            ...prev,
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
                                            languageByPostId[row.id] ??
                                            enabledLanguages[0]?.id;

                                        if (!selectedLanguageId) {
                                            return;
                                        }

                                        router.visit(
                                            editPostTranslation({
                                                post: row.id,
                                                language: selectedLanguageId,
                                            }).url,
                                        );
                                    }}
                                >
                                    Translate
                                </Button>
                            </>
                        )}

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
                                        This action will move post to trash.
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
                    </div>

                    <div className="flex flex-wrap gap-1">
                        {enabledLanguages.map((language) => {
                            const translated = row.translations?.some(
                                (translation) =>
                                    translation.language_id === language.id,
                            );

                            return (
                                <span
                                    key={`${row.id}-${language.id}`}
                                    className={`rounded px-2 py-0.5 text-[11px] ${
                                        translated
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {language.code.toUpperCase()}:{' '}
                                    {translated ? 'done' : 'empty'}
                                </span>
                            );
                        })}
                    </div>
                </div>
            ),
        },
    ];

    const statusFilters = ['publish', 'draft', 'trash', 'all'];

    return (
        <>
            <Head title="Posts" />

            <div className="container mx-auto space-y-6 px-6 py-10">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Posts</h1>
                        <p className="text-muted-foreground">Manage your posts data</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/posts/usage-guide">
                            <Button variant="outline">Cara Penggunaan</Button>
                        </Link>
                        <Link href="/dashboard/posts/create">
                            <Button>Add Post</Button>
                        </Link>
                    </div>
                </div>

                {/* FILTER */}
                <div className="space-y-3">
                    <div className="flex gap-3">
                        <Input
                            placeholder="Search..."
                            value={data.search}
                            onChange={(e) => setData('search', e.target.value)}
                        />

                        <Button onClick={applyFilter} disabled={processing}>
                            Apply
                        </Button>
                    </div>

                    {/* STATUS FILTER */}
                    <div className="flex gap-2">
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

                {/* TABLE */}
                <div className="rounded-xl bg-card p-6 shadow">
                    <DataTable<Post> data={posts.data} columns={columns} />
                </div>

                {/* PAGINATION */}
                <div className="flex gap-2">
                    {posts.links.map((link, i) => (
                        <button
                            key={i}
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

/**
 * LAYOUT
 */
Index.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Posts', href: '/dashboard/posts' }]}>
        {page}
    </AppLayout>
);
