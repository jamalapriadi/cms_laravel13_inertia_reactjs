import { Head, Link, router } from '@inertiajs/react';
import { Languages, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
    create,
    destroy,
    edit,
    index,
} from '@/actions/App/Http/Controllers/Dashboard/DynamicContentEntryController';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePermission } from '@/lib/permissions';
import type {
    DynamicContentEntry,
    DynamicContentType,
} from '@/types/dynamic-content';
import type { LaravelPagination } from '@/types/LaravelPagination';

interface Props {
    contentType: DynamicContentType;
    entries: LaravelPagination<DynamicContentEntry>;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function Index({ contentType, entries, filters }: Props) {
    const { hasPermission } = usePermission();
    const canCreate = hasPermission('dynamic-contents.create');
    const canEdit = hasPermission('dynamic-contents.edit');
    const canDelete = hasPermission('dynamic-contents.delete');
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.visit(
            index(
                {
                    contentType: contentType.slug,
                },
                {
                    query: {
                        search: search || undefined,
                        status: status !== 'all' ? status : undefined,
                    },
                },
            ).url,
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = () => {
        if (!deletingId) {
            return;
        }

        router.delete(
            destroy({
                contentType: contentType.slug,
                contentEntry: deletingId,
            }).url,
            {
                preserveScroll: true,
                onFinish: () => setDeletingId(null),
            },
        );
    };

    const columns = [
        {
            label: 'Title',
            render: (row: DynamicContentEntry) => (
                <div>
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">/{row.slug}</p>
                </div>
            ),
        },
        {
            label: 'Status',
            render: (row: DynamicContentEntry) => (
                <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.status === 'published'
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
            label: 'Published At',
            render: (row: DynamicContentEntry) => (
                <span className="text-sm text-muted-foreground">
                    {row.published_at
                        ? new Date(row.published_at).toLocaleString()
                        : '-'}
                </span>
            ),
        },
        {
            label: 'Sort',
            render: (row: DynamicContentEntry) => (
                <span className="font-mono text-xs">{row.sort_order}</span>
            ),
        },
        {
            label: 'Actions',
            render: (row: DynamicContentEntry) => (
                <div className="flex gap-2">
                    {canEdit && (
                        <Link
                            href={
                                `/my-admin/dashboard/content/${contentType.slug}/${row.id}/translations`
                            }
                        >
                            <Button size="sm" variant="secondary" title="Translate">
                                <Languages className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    )}
                    {canEdit && (
                        <Link
                            href={
                                edit({
                                    contentType: contentType.slug,
                                    contentEntry: row.id,
                                }).url
                            }
                        >
                            <Button size="sm" variant="secondary" title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    )}
                    {canDelete && (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeletingId(row.id)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title={contentType.name} />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {contentType.name}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage dynamic entries for the {contentType.name}{' '}
                            content type.
                        </p>
                    </div>

                    {canCreate && (
                        <Link
                            href={create({ contentType: contentType.slug }).url}
                        >
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Entry
                            </Button>
                        </Link>
                    )}
                </div>

                <hr className="border-border" />

                <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                    <Input
                        placeholder="Search title, slug, excerpt, or field values..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) =>
                            event.key === 'Enter' && applyFilter()
                        }
                    />
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                    <Button onClick={applyFilter}>Apply Filter</Button>
                </div>

                <DataTable<DynamicContentEntry>
                    data={entries.data}
                    columns={columns}
                />

                <div className="flex flex-wrap gap-2">
                    {entries.links.map((link, indexLink) => (
                        <button
                            key={`${link.label}-${indexLink}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded px-3 py-1 text-sm ${
                                link.active
                                    ? 'bg-primary font-semibold text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted'
                            } ${!link.url && 'pointer-events-none opacity-50'}`}
                        />
                    ))}
                </div>
            </div>

            <AlertDialog
                open={!!deletingId}
                onOpenChange={() => setDeletingId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete content entry?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will soft-delete the selected entry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
