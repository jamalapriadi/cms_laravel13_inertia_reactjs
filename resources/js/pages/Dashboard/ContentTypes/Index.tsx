import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
    create,
    destroy,
    edit,
    index,
} from '@/actions/App/Http/Controllers/Dashboard/ContentTypeController';
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
import type { DynamicContentType } from '@/types/dynamic-content';
import type { LaravelPagination } from '@/types/LaravelPagination';

interface Props {
    contentTypes: LaravelPagination<DynamicContentType>;
    filters: {
        search?: string;
    };
}

export default function Index({ contentTypes, filters }: Props) {
    const { hasPermission } = usePermission();
    const canCreate = hasPermission('content-types.create');
    const canEdit = hasPermission('content-types.edit');
    const canDelete = hasPermission('content-types.delete');
    const [search, setSearch] = useState(filters.search || '');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const applyFilter = () => {
        router.visit(
            index({
                query: {
                    search: search || undefined,
                },
            }).url,
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

        router.delete(destroy({ contentType: deletingId }).url, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    const columns = [
        {
            label: 'Name',
            render: (row: DynamicContentType) => (
                <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">/{row.slug}</p>
                </div>
            ),
        },
        {
            label: 'Status',
            render: (row: DynamicContentType) => (
                <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                    }`}
                >
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            label: 'Entries',
            render: (row: DynamicContentType) => row.entries_count ?? 0,
        },
        {
            label: 'Field Groups',
            render: (row: DynamicContentType) => row.field_groups_count ?? 0,
        },
        {
            label: 'Sort',
            render: (row: DynamicContentType) => (
                <span className="font-mono text-xs">{row.sort_order}</span>
            ),
        },
        {
            label: 'Actions',
            render: (row: DynamicContentType) => (
                <div className="flex gap-2">
                    {canEdit && (
                        <Link href={edit({ contentType: row.id }).url}>
                            <Button size="sm" variant="secondary">
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
            <Head title="Content Types" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Content Types
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage dynamic content collections such as
                            testimonials, sliders, partners, and services.
                        </p>
                    </div>

                    {canCreate && (
                        <Link href={create().url}>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Content Type
                            </Button>
                        </Link>
                    )}
                </div>

                <hr className="border-border" />

                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <Input
                        placeholder="Search name, slug, or description..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) =>
                            event.key === 'Enter' && applyFilter()
                        }
                    />
                    <Button onClick={applyFilter}>Apply Filter</Button>
                </div>

                <DataTable<DynamicContentType>
                    data={contentTypes.data}
                    columns={columns}
                />

                <div className="flex flex-wrap gap-2">
                    {contentTypes.links.map((link, indexLink) => (
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
                            Delete content type?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will soft-delete the content type and hide its
                            dynamic content entries from the dashboard sidebar.
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
